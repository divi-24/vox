"""
Decisions API endpoints.

GET /api/decisions - List all decisions
GET /api/decisions/{decision_id} - Decision details with related tasks
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List, Optional

from app.models.database import Decision, get_session

logger = logging.getLogger(__name__)

router = APIRouter()


class DecisionResponse(BaseModel):
    id: str
    decision_statement: str
    confidence_score: float
    meeting_id: str
    created_at: str
    related_tasks: Optional[List[str]] = None


@router.get("/", response_model=List[DecisionResponse])
async def list_decisions(
    confidence_min: float = Query(0.0),
    limit: int = Query(50),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_session)
):
    """
    List all decisions.
    
    Query params:
    - confidence_min: Filter decisions by minimum confidence score
    - limit: Number of results
    - offset: Pagination offset
    """
    
    try:
        query = select(Decision)
        
        if confidence_min > 0:
            query = query.where(Decision.confidence_score >= confidence_min)
        
        result = await db.execute(
            query.order_by(Decision.created_at.desc()).limit(limit).offset(offset)
        )
        decisions = result.scalars().all()
        
        return [
            {
                "id": str(decision.id),
                "decision_statement": decision.decision_statement,
                "confidence_score": decision.confidence_score,
                "meeting_id": str(decision.meeting_id),
                "created_at": decision.created_at.isoformat(),
                "related_tasks": decision.related_tasks or []
            }
            for decision in decisions
        ]
    except Exception as e:
        logger.error(f"Failed to list decisions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch decisions")


@router.get("/{decision_id}", response_model=DecisionResponse)
async def get_decision_details(
    decision_id: str,
    db: AsyncSession = Depends(get_session)
):
    """Get decision details with related tasks"""
    
    try:
        result = await db.execute(
            select(Decision).where(Decision.id == decision_id)
        )
        decision = result.scalar_one_or_none()
        
        if not decision:
            raise HTTPException(status_code=404, detail="Decision not found")
        
        return {
            "id": str(decision.id),
            "decision_statement": decision.decision_statement,
            "confidence_score": decision.confidence_score,
            "meeting_id": str(decision.meeting_id),
            "created_at": decision.created_at.isoformat(),
            "related_tasks": decision.related_tasks or []
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get decision: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch decision")
