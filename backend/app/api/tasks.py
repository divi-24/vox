"""
Tasks API endpoints.

GET /api/tasks - List tasks with filtering
GET /api/tasks/{task_id} - Task details
PUT /api/tasks/{task_id} - Update task status
GET /api/tasks/overdue - Get overdue tasks
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

from app.models.database import Task, get_session

logger = logging.getLogger(__name__)

router = APIRouter()


class TaskResponse(BaseModel):
    id: str
    meeting_id: str
    task_description: str
    assignee: Optional[str]
    deadline: Optional[str]
    confidence_score: float
    risk_score: Optional[float]
    risk_level: Optional[str]
    status: str
    created_at: str


class TaskUpdateRequest(BaseModel):
    status: Optional[str] = None
    assignee: Optional[str] = None
    deadline: Optional[str] = None


@router.get("/", response_model=List[TaskResponse])
async def list_tasks(
    status: Optional[str] = Query(None, description="Filter by status"),
    assignee: Optional[str] = Query(None, description="Filter by assignee"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level"),
    limit: int = Query(50),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_session)
):
    """
    List tasks with filtering.
    
    Status: pending, in_progress, completed, overdue
    Risk Level: Low, Medium, High, Critical
    """
    
    try:
        query = select(Task)
        
        # Apply filters
        filters = []
        if status:
            filters.append(Task.status == status)
        if assignee:
            filters.append(Task.assignee == assignee)
        if risk_level:
            filters.append(Task.risk_level == risk_level)
        
        if filters:
            query = query.where(and_(*filters))
        
        result = await db.execute(query.limit(limit).offset(offset))
        tasks = result.scalars().all()
        
        return [
            {
                "id": str(task.id),
                "meeting_id": str(task.meeting_id),
                "task_description": task.task_description,
                "assignee": task.assignee,
                "deadline": task.deadline.isoformat() if task.deadline else None,
                "confidence_score": task.confidence_score,
                "risk_score": task.risk_score,
                "risk_level": task.risk_level,
                "status": task.status,
                "created_at": task.created_at.isoformat()
            }
            for task in tasks
        ]
    except Exception as e:
        logger.error(f"Failed to list tasks: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch tasks")


@router.get("/overdue", response_model=List[TaskResponse])
async def get_overdue_tasks(
    db: AsyncSession = Depends(get_session)
):
    """Get all overdue tasks (deadline < now, status != completed)"""
    
    try:
        now = datetime.utcnow()
        
        result = await db.execute(
            select(Task).where(
                and_(
                    Task.deadline < now,
                    Task.status != "completed"
                )
            )
        )
        tasks = result.scalars().all()
        
        # Mark as overdue
        for task in tasks:
            task.status = "overdue"
        
        await db.commit()
        
        return [
            {
                "id": str(task.id),
                "meeting_id": str(task.meeting_id),
                "task_description": task.task_description,
                "assignee": task.assignee,
                "deadline": task.deadline.isoformat() if task.deadline else None,
                "confidence_score": task.confidence_score,
                "risk_score": task.risk_score,
                "risk_level": task.risk_level,
                "status": task.status,
                "created_at": task.created_at.isoformat()
            }
            for task in tasks
        ]
    except Exception as e:
        logger.error(f"Failed to get overdue tasks: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch overdue tasks")


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task_details(
    task_id: str,
    db: AsyncSession = Depends(get_session)
):
    """Get task details by ID"""
    
    try:
        result = await db.execute(
            select(Task).where(Task.id == task_id)
        )
        task = result.scalar_one_or_none()
        
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        return {
            "id": str(task.id),
            "meeting_id": str(task.meeting_id),
            "task_description": task.task_description,
            "assignee": task.assignee,
            "deadline": task.deadline.isoformat() if task.deadline else None,
            "confidence_score": task.confidence_score,
            "risk_score": task.risk_score,
            "risk_level": task.risk_level,
            "status": task.status,
            "created_at": task.created_at.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get task: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch task")


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    request: TaskUpdateRequest,
    db: AsyncSession = Depends(get_session)
):
    """Update task status, assignee, or deadline"""
    
    try:
        result = await db.execute(
            select(Task).where(Task.id == task_id)
        )
        task = result.scalar_one_or_none()
        
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        
        # Update fields
        if request.status:
            task.status = request.status
        if request.assignee:
            task.assignee = request.assignee
        if request.deadline:
            task.deadline = datetime.fromisoformat(request.deadline)
        
        task.updated_at = datetime.utcnow()
        await db.commit()
        
        return {
            "id": str(task.id),
            "meeting_id": str(task.meeting_id),
            "task_description": task.task_description,
            "assignee": task.assignee,
            "deadline": task.deadline.isoformat() if task.deadline else None,
            "confidence_score": task.confidence_score,
            "risk_score": task.risk_score,
            "risk_level": task.risk_level,
            "status": task.status,
            "created_at": task.created_at.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update task: {e}")
        raise HTTPException(status_code=500, detail="Failed to update task")
