"""
Risk Report API endpoints.

GET /api/risk/summary - Aggregate risk dashboard
GET /api/risk/by-assignee - Risk breakdown by assignee
GET /api/risk/timeline - Risk trends over time
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime, timedelta

from app.models.database import Task, get_session
from app.risk.risk_engine import RiskEngine

logger = logging.getLogger(__name__)

router = APIRouter()


class RiskSummary(BaseModel):
    total_tasks: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    average_risk_score: float
    risk_breakdown_percentage: Dict[str, float]


class RiskByAssignee(BaseModel):
    assignee: str
    task_count: int
    average_risk_score: float
    critical_count: int
    high_count: int


@router.get("/summary", response_model=RiskSummary)
async def get_risk_summary(
    db: AsyncSession = Depends(get_session)
):
    """
    Get aggregated risk dashboard.
    
    Returns:
    - Total task count
    - Breakdown by risk level
    - Average risk score
    """
    
    try:
        result = await db.execute(select(Task))
        tasks = result.scalars().all()
        
        if not tasks:
            return {
                "total_tasks": 0,
                "critical_count": 0,
                "high_count": 0,
                "medium_count": 0,
                "low_count": 0,
                "average_risk_score": 0,
                "risk_breakdown_percentage": {
                    "critical": 0,
                    "high": 0,
                    "medium": 0,
                    "low": 0
                }
            }
        
        # Count by risk level
        risk_counts = {
            "critical": sum(1 for t in tasks if t.risk_level == "Critical"),
            "high": sum(1 for t in tasks if t.risk_level == "High"),
            "medium": sum(1 for t in tasks if t.risk_level == "Medium"),
            "low": sum(1 for t in tasks if t.risk_level == "Low"),
        }
        
        # Calculate average
        total_risk = sum(t.risk_score or 0 for t in tasks)
        avg_score = total_risk / len(tasks)
        
        # Percentage breakdown
        total = len(tasks)
        risk_breakdown = {
            "critical": round((risk_counts["critical"] / total) * 100, 1),
            "high": round((risk_counts["high"] / total) * 100, 1),
            "medium": round((risk_counts["medium"] / total) * 100, 1),
            "low": round((risk_counts["low"] / total) * 100, 1),
        }
        
        return {
            "total_tasks": len(tasks),
            "critical_count": risk_counts["critical"],
            "high_count": risk_counts["high"],
            "medium_count": risk_counts["medium"],
            "low_count": risk_counts["low"],
            "average_risk_score": round(avg_score, 2),
            "risk_breakdown_percentage": risk_breakdown
        }
    except Exception as e:
        logger.error(f"Failed to generate risk summary: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate summary")


@router.get("/by-assignee", response_model=List[RiskByAssignee])
async def get_risk_by_assignee(
    db: AsyncSession = Depends(get_session)
):
    """
    Risk breakdown by assignee.
    
    Shows which team members have the riskiest tasks.
    """
    
    try:
        result = await db.execute(select(Task))
        tasks = result.scalars().all()
        
        # Group by assignee
        assignee_data = {}
        for task in tasks:
            if not task.assignee:
                continue
            
            if task.assignee not in assignee_data:
                assignee_data[task.assignee] = {
                    "tasks": [],
                    "critical_count": 0,
                    "high_count": 0
                }
            
            assignee_data[task.assignee]["tasks"].append(task)
            
            if task.risk_level == "Critical":
                assignee_data[task.assignee]["critical_count"] += 1
            elif task.risk_level == "High":
                assignee_data[task.assignee]["high_count"] += 1
        
        # Build response
        result_list = []
        for assignee, data in assignee_data.items():
            tasks_list = data["tasks"]
            avg_risk = sum(t.risk_score or 0 for t in tasks_list) / len(tasks_list)
            
            result_list.append({
                "assignee": assignee,
                "task_count": len(tasks_list),
                "average_risk_score": round(avg_risk, 2),
                "critical_count": data["critical_count"],
                "high_count": data["high_count"]
            })
        
        # Sort by average risk (descending)
        result_list.sort(key=lambda x: x["average_risk_score"], reverse=True)
        
        return result_list
    except Exception as e:
        logger.error(f"Failed to get risk by assignee: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch assignee risk data")


@router.get("/timeline")
async def get_risk_timeline(
    days: int = Query(30, description="Number of days to look back"),
    db: AsyncSession = Depends(get_session)
):
    """
    Risk trends over time.
    
    Returns daily aggregated risk metrics.
    """
    
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        result = await db.execute(
            select(Task).where(Task.created_at >= cutoff_date)
        )
        tasks = result.scalars().all()
        
        # Group by date
        timeline = {}
        for task in tasks:
            date_key = task.created_at.date().isoformat()
            
            if date_key not in timeline:
                timeline[date_key] = {
                    "date": date_key,
                    "task_count": 0,
                    "avg_risk_score": 0,
                    "critical_count": 0,
                    "high_count": 0
                }
            
            timeline[date_key]["task_count"] += 1
            timeline[date_key]["avg_risk_score"] += task.risk_score or 0
            
            if task.risk_level == "Critical":
                timeline[date_key]["critical_count"] += 1
            elif task.risk_level == "High":
                timeline[date_key]["high_count"] += 1
        
        # Calculate averages
        for date_key in timeline:
            count = timeline[date_key]["task_count"]
            timeline[date_key]["avg_risk_score"] = round(
                timeline[date_key]["avg_risk_score"] / count,
                2
            )
        
        # Sort by date
        sorted_timeline = sorted(timeline.items(), key=lambda x: x[0])
        
        return {
            "period_days": days,
            "timeline": [item[1] for item in sorted_timeline]
        }
    except Exception as e:
        logger.error(f"Failed to get risk timeline: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch risk timeline")
