"""
Meetings API endpoints.

POST /api/meetings/upload - Upload audio file
GET /api/meetings - List all meetings
GET /api/meetings/{meeting_id} - Get meeting details with extracted intelligence
"""

import logging
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List
import uuid
from datetime import datetime

from app.models.database import Meeting, get_session, Task, Decision
from app.ml.transcription import TranscriptionService
from app.ml.extraction import HybridExtractionPipeline
from app.risk.risk_engine import RiskEngine
from app.graph.neo4j_client import Neo4jClient

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize services (shared instance)
transcription_service = TranscriptionService()
extraction_pipeline = HybridExtractionPipeline()


class MeetingResponse(BaseModel):
    id: str
    title: str
    duration_seconds: int | None = None
    created_at: str
    transcript_segments: int
    tasks_extracted: int
    decisions_extracted: int


class MeetingDetailResponse(BaseModel):
    id: str
    title: str
    duration_seconds: int
    transcript_raw: str
    segments: List[dict]
    tasks: List[dict]
    decisions: List[dict]
    created_at: str


@router.post("/upload", response_model=dict)
async def upload_meeting(
    file: UploadFile = File(...),
    title: str = None,
    db: AsyncSession = Depends(get_session)
):
    """
    Upload audio file and process meeting.
    
    1. Transcribe audio
    2. Extract tasks and decisions
    3. Assess risk
    4. Persist to PostgreSQL + Neo4j
    """
    
    if not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="File must be audio")
    
    # Save uploaded file temporarily
    import tempfile
    import os
    
    meeting_id = str(uuid.uuid4())
    
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        logger.info(f"Processing meeting {meeting_id}: {file.filename}")
        
        # Step 1: Transcribe
        segments = await transcription_service.transcribe_with_timestamps(tmp_path)
        duration_seconds = int(max([s.get("end_time", 0) for s in segments], default=0)) if segments else 0
        
        # Step 2: Extract intelligence
        extraction_result = extraction_pipeline.extract_from_segments(segments)
        tasks = extraction_result["tasks"]
        decisions = extraction_result["decisions"]
        
        # Step 3: Assess risk
        risk_engine = RiskEngine(db_session=db)
        tasks_with_risk = []
        for task in tasks:
            risk_assessment = await risk_engine.assess_task_risk({
                "task_id": str(uuid.uuid4()),
                "task_description": task.get("task", ""),
                "assignee": task.get("assignee"),
                "deadline": task.get("deadline"),
                "meeting_id": meeting_id,
                "created_at": datetime.utcnow().isoformat()
            })
            task["risk_score"] = risk_assessment["risk_score"]
            task["risk_level"] = risk_assessment["risk_level"]
            task["risk_factors"] = risk_assessment["risk_factors"]
            tasks_with_risk.append(risk_assessment)
        
        # Step 4: Persist to PostgreSQL
        meeting_record = Meeting(
            id=uuid.UUID(meeting_id),
            title=title or file.filename,
            duration_seconds=duration_seconds,
            transcript_raw=extraction_result["raw_text"],
            transcript_structured=extraction_result["metadata"]
        )
        db.add(meeting_record)
        
        # Create task records
        for task in tasks:
            task_id = uuid.uuid4()
            task_record = Task(
                id=task_id,
                meeting_id=uuid.UUID(meeting_id),
                task_description=task.get("task", ""),
                assignee=task.get("assignee"),
                deadline=task.get("deadline"),
                confidence_score=task.get("confidence_score", 0.0),
                extraction_metadata=task,
                risk_score=task.get("risk_score"),
                risk_level=task.get("risk_level"),
                status="pending"
            )
            db.add(task_record)
            
            # Persist to Neo4j
            neo4j = Neo4jClient()
            neo4j.connect()
            neo4j.create_task_node(
                str(task_id),
                task.get("task", ""),
                task.get("deadline"),
                {"risk_score": task.get("risk_score"), "assignee": task.get("assignee")}
            )
            neo4j.link_task_to_meeting(str(task_id), meeting_id)
            if task.get("assignee"):
                neo4j.create_person_node(task.get("assignee"))
                neo4j.link_task_to_person(str(task_id), task.get("assignee"))
            neo4j.close()
        
        # Create decision records
        for decision in decisions:
            decision_id = uuid.uuid4()
            decision_record = Decision(
                id=decision_id,
                meeting_id=uuid.UUID(meeting_id),
                decision_statement=decision.get("decision", ""),
                confidence_score=decision.get("confidence_score", 0.0),
                extraction_metadata=decision,
                related_tasks=None
            )
            db.add(decision_record)
            
            # Persist to Neo4j
            neo4j = Neo4jClient()
            neo4j.connect()
            neo4j.create_decision_node(
                str(decision_id),
                decision.get("decision", ""),
                decision.get("confidence_score", 0.0)
            )
            neo4j.link_decision_to_meeting(str(decision_id), meeting_id)
            neo4j.close()
        
        await db.commit()
        
        # Cleanup
        os.remove(tmp_path)
        
        return {
            "status": "success",
            "meeting_id": meeting_id,
            "title": title or file.filename,
            "duration_seconds": duration_seconds,
            "segments": len(segments),
            "tasks_extracted": len(tasks),
            "decisions_extracted": len(decisions),
            "processing_metadata": extraction_result["metadata"]
        }
        
    except Exception as e:
        logger.error(f"Meeting processing failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@router.get("/", response_model=List[MeetingResponse])
async def list_meetings(
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_session)
):
    """List all meetings with task/decision counts"""
    
    try:
        result = await db.execute(
            select(Meeting).limit(limit).offset(offset)
        )
        meetings = result.scalars().all()
        
        response = []
        for meeting in meetings:
            # Count tasks and decisions
            tasks_result = await db.execute(
                select(Task).where(Task.meeting_id == meeting.id)
            )
            tasks = tasks_result.scalars().all()
            
            decisions_result = await db.execute(
                select(Decision).where(Decision.meeting_id == meeting.id)
            )
            decisions = decisions_result.scalars().all()
            
            response.append({
                "id": str(meeting.id),
                "title": meeting.title,
                "duration_seconds": meeting.duration_seconds or 0,
                "created_at": meeting.created_at.isoformat(),
                "transcript_segments": 0,
                "tasks_extracted": len(tasks),
                "decisions_extracted": len(decisions)
            })
        
        return response
    except Exception as e:
        logger.error(f"Failed to list meetings: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch meetings")


@router.get("/{meeting_id}", response_model=MeetingDetailResponse)
async def get_meeting_details(
    meeting_id: str,
    db: AsyncSession = Depends(get_session)
):
    """Get meeting with all extracted intelligence"""
    
    try:
        # Fetch meeting
        result = await db.execute(
            select(Meeting).where(Meeting.id == meeting_id)
        )
        meeting = result.scalar_one_or_none()
        
        if not meeting:
            raise HTTPException(status_code=404, detail="Meeting not found")
        
        # Fetch tasks
        tasks_result = await db.execute(
            select(Task).where(Task.meeting_id == meeting.id)
        )
        tasks = [
            {
                "id": str(task.id),
                "task": task.task_description,
                "assignee": task.assignee,
                "deadline": task.deadline.isoformat() if task.deadline else None,
                "confidence_score": task.confidence_score,
                "risk_score": task.risk_score,
                "risk_level": task.risk_level,
                "status": task.status
            }
            for task in tasks_result.scalars().all()
        ]
        
        # Fetch decisions
        decisions_result = await db.execute(
            select(Decision).where(Decision.meeting_id == meeting.id)
        )
        decisions = [
            {
                "id": str(decision.id),
                "decision": decision.decision_statement,
                "confidence_score": decision.confidence_score
            }
            for decision in decisions_result.scalars().all()
        ]
        
        return {
            "id": str(meeting.id),
            "title": meeting.title,
            "duration_seconds": meeting.duration_seconds,
            "transcript_raw": meeting.transcript_raw or "",
            "segments": [],
            "tasks": tasks,
            "decisions": decisions,
            "created_at": meeting.created_at.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get meeting details: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch meeting")
