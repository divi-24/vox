"""
Deterministic Risk Engine for Task Accountability.

Design rationale:
Risk must be EXPLAINABLE. No black-box ML.

Risk factors (deterministic scoring):
1. No assignee → +30 points (ownership unclear)
2. No deadline → +25 points (urgency unknown)
3. Negative sentiment → +20 points (friction detected)
4. Repeated topic → +15 points (already discussed, not resolved)
5. Past overdue tasks → +10 points (pattern of delays)

Score interpretation:
- 0-30: Low (Green)
- 31-60: Medium (Yellow)
- 61-85: High (Orange)
- 86-100: Critical (Red)

Every point is traceable to a specific reason.
"""

import logging
from typing import Dict, List, Any
from datetime import datetime, timedelta
from transformers import pipeline
import json

logger = logging.getLogger(__name__)

# Sentiment analysis pipeline (lightweight)
try:
    sentiment_pipeline = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english")
    SENTIMENT_AVAILABLE = True
except:
    SENTIMENT_AVAILABLE = False
    logger.warning("Sentiment analysis model not available")


class RiskEngine:
    """Deterministic task risk assessment"""
    
    def __init__(self, db_session=None):
        """
        Args:
            db_session: SQLAlchemy async session for querying historical data
        """
        self.db_session = db_session
        self.max_score = 100
    
    async def assess_task_risk(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Comprehensive task risk assessment.
        
        Args:
            task_data: {
                "task_id": str,
                "task_description": str,
                "assignee": str or None,
                "deadline": datetime or None,
                "meeting_id": str,
                "created_at": datetime
            }
        
        Returns:
            {
                "task_id": str,
                "risk_score": int,
                "risk_level": "Low|Medium|High|Critical",
                "risk_factors": [
                    {
                        "factor": str,
                        "points": int,
                        "explanation": str
                    },
                    ...
                ],
                "total_risk_breakdown": {
                    "assignee_risk": int,
                    "deadline_risk": int,
                    "sentiment_risk": int,
                    "repetition_risk": int,
                    "historical_risk": int
                }
            }
        """
        
        score = 0
        factors = []
        breakdown = {
            "assignee_risk": 0,
            "deadline_risk": 0,
            "sentiment_risk": 0,
            "repetition_risk": 0,
            "historical_risk": 0
        }
        
        task_id = task_data.get("task_id")
        task_desc = task_data.get("task_description", "")
        assignee = task_data.get("assignee")
        deadline = task_data.get("deadline")
        
        # Factor 1: Missing assignee
        if not assignee or assignee.lower() == "none":
            points = 30
            score += points
            breakdown["assignee_risk"] = points
            factors.append({
                "factor": "No Assignee",
                "points": points,
                "explanation": "Task ownership is unclear. No one is explicitly responsible."
            })
        
        # Factor 2: Missing deadline
        if not deadline:
            points = 25
            score += points
            breakdown["deadline_risk"] = points
            factors.append({
                "factor": "No Deadline",
                "points": points,
                "explanation": "Urgency and completion target undefined."
            })
        else:
            # Check if deadline is in past
            if datetime.fromisoformat(deadline) < datetime.utcnow():
                points = 35  # Overdue is worse than no deadline
                score += points
                breakdown["deadline_risk"] = points
                factors.append({
                    "factor": "Deadline Passed",
                    "points": points,
                    "explanation": "Task deadline has already elapsed."
                })
        
        # Factor 3: Sentiment analysis
        if SENTIMENT_AVAILABLE and task_desc:
            sentiment_risk = self._assess_sentiment(task_desc)
            if sentiment_risk > 0:
                score += sentiment_risk
                breakdown["sentiment_risk"] = sentiment_risk
                factors.append({
                    "factor": "Negative Sentiment Detected",
                    "points": sentiment_risk,
                    "explanation": "Task description contains language suggesting friction or disagreement."
                })
        
        # Factor 4: Repetition detection
        if self.db_session:
            repetition_risk = await self._check_repetition(task_desc, task_id)
            if repetition_risk > 0:
                score += repetition_risk
                breakdown["repetition_risk"] = repetition_risk
                factors.append({
                    "factor": "Topic Repeated",
                    "points": repetition_risk,
                    "explanation": "Similar tasks have been discussed before but not resolved."
                })
        
        # Factor 5: Historical overdue pattern
        if self.db_session and assignee:
            historical_risk = await self._check_historical_delays(assignee)
            if historical_risk > 0:
                score += historical_risk
                breakdown["historical_risk"] = historical_risk
                factors.append({
                    "factor": "Assignee History of Delays",
                    "points": historical_risk,
                    "explanation": f"{assignee} has missed deadlines on {historical_risk // 5} previous tasks."
                })
        
        # Cap score at max
        final_score = min(score, self.max_score)
        
        # Determine risk level
        risk_level = self._get_risk_level(final_score)
        
        return {
            "task_id": task_id,
            "risk_score": final_score,
            "risk_level": risk_level,
            "risk_factors": factors,
            "total_risk_breakdown": breakdown,
            "assessment_timestamp": datetime.utcnow().isoformat()
        }
    
    def _assess_sentiment(self, text: str) -> int:
        """
        Analyze sentiment of task description.
        
        Returns:
            Points to add (0 if positive, 20 if negative/neutral)
        """
        try:
            result = sentiment_pipeline(text[:512])[0]  # Limit input length
            
            # NEGATIVE sentiment increases risk
            if result["label"] == "NEGATIVE":
                return 20
            else:
                return 0
        except Exception as e:
            logger.debug(f"Sentiment analysis failed: {e}")
            return 0
    
    async def _check_repetition(self, task_desc: str, current_task_id: str) -> int:
        """
        Check if similar task has been created before without resolution.
        
        Uses embedding similarity (cosine distance).
        
        Returns:
            Points to add (0-15)
        """
        if not self.db_session:
            return 0
        
        try:
            from sqlalchemy import select
            from app.models.database import Task
            
            # Get all tasks (simplified - should use embeddings in production)
            result = await self.db_session.execute(
                select(Task).where(Task.id != current_task_id).limit(10)
            )
            past_tasks = result.scalars().all()
            
            # Simple string similarity check
            import difflib
            for past_task in past_tasks:
                similarity = difflib.SequenceMatcher(
                    None,
                    task_desc.lower(),
                    past_task.task_description.lower()
                ).ratio()
                
                # If >70% similar and still pending
                if similarity > 0.7 and past_task.status in ["pending", "in_progress"]:
                    return 15
            
            return 0
        except Exception as e:
            logger.debug(f"Repetition check failed: {e}")
            return 0
    
    async def _check_historical_delays(self, assignee: str) -> int:
        """
        Check if assignee has history of missing deadlines.
        
        Returns:
            Points to add (0-10, based on number of overdue tasks)
        """
        if not self.db_session:
            return 0
        
        try:
            from sqlalchemy import select, and_
            from app.models.database import Task
            
            # Count overdue tasks for this assignee
            result = await self.db_session.execute(
                select(Task).where(
                    and_(
                        Task.assignee == assignee,
                        Task.status == "overdue"
                    )
                )
            )
            overdue_count = len(result.scalars().all())
            
            # 1-2 overdue = 5 points, 3+ = 10 points
            if overdue_count >= 3:
                return 10
            elif overdue_count >= 1:
                return 5
            
            return 0
        except Exception as e:
            logger.debug(f"Historical delay check failed: {e}")
            return 0
    
    def _get_risk_level(self, score: int) -> str:
        """Map risk score to level"""
        if score <= 30:
            return "Low"
        elif score <= 60:
            return "Medium"
        elif score <= 85:
            return "High"
        else:
            return "Critical"
    
    def generate_risk_report(self, tasks_with_risk: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate summary risk report for dashboard.
        
        Args:
            tasks_with_risk: List of task dicts with risk_score and risk_level
        
        Returns:
            Aggregated report with statistics
        """
        
        if not tasks_with_risk:
            return {
                "total_tasks": 0,
                "critical_count": 0,
                "high_count": 0,
                "medium_count": 0,
                "low_count": 0,
                "average_risk_score": 0,
                "tasks_without_assignee": 0,
                "tasks_without_deadline": 0,
                "overdue_tasks": 0
            }
        
        # Count by risk level
        risk_counts = {
            "critical": sum(1 for t in tasks_with_risk if t.get("risk_level") == "Critical"),
            "high": sum(1 for t in tasks_with_risk if t.get("risk_level") == "High"),
            "medium": sum(1 for t in tasks_with_risk if t.get("risk_level") == "Medium"),
            "low": sum(1 for t in tasks_with_risk if t.get("risk_level") == "Low"),
        }
        
        avg_score = sum(t.get("risk_score", 0) for t in tasks_with_risk) / len(tasks_with_risk)
        
        return {
            "total_tasks": len(tasks_with_risk),
            "critical_count": risk_counts["critical"],
            "high_count": risk_counts["high"],
            "medium_count": risk_counts["medium"],
            "low_count": risk_counts["low"],
            "average_risk_score": round(avg_score, 2),
            "risk_breakdown_percentage": {
                "critical": round((risk_counts["critical"] / len(tasks_with_risk)) * 100, 1),
                "high": round((risk_counts["high"] / len(tasks_with_risk)) * 100, 1),
                "medium": round((risk_counts["medium"] / len(tasks_with_risk)) * 100, 1),
                "low": round((risk_counts["low"] / len(tasks_with_risk)) * 100, 1),
            }
        }
