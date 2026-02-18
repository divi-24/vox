"""
Documents API endpoints.

POST /api/documents/upload - Upload PDF, Word, PowerPoint
GET /api/documents - List documents
GET /api/documents/{doc_id} - Document details with extracted intelligence
"""

import logging
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
from datetime import datetime
import tempfile
import os

from app.models.database import Meeting, get_session, Task, Decision
from app.ml.document_processing import DocumentProcessor
from app.ml.extraction import HybridExtractionPipeline
from app.risk.risk_engine import RiskEngine
from app.graph.neo4j_client import Neo4jClient

logger = logging.getLogger(__name__)

router = APIRouter()

document_processor = DocumentProcessor()
extraction_pipeline = HybridExtractionPipeline()


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: str = None,
    db: AsyncSession = Depends(get_session)
):
    """
    Upload and process document (PDF, Word, PowerPoint).
    
    1. Extract text from document
    2. Extract tasks and decisions
    3. Assess risk
    4. Persist to PostgreSQL + Neo4j
    """
    
    # Determine document type
    filename = file.filename.lower()
    doc_type = None
    
    if filename.endswith(".pdf"):
        doc_type = "pdf"
    elif filename.endswith(".docx"):
        doc_type = "docx"
    elif filename.endswith(".pptx"):
        doc_type = "pptx"
    else:
        raise HTTPException(status_code=400, detail="Supported formats: PDF, DOCX, PPTX")
    
    doc_id = str(uuid.uuid4())
    
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{doc_type}") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        logger.info(f"Processing document {doc_id}: {file.filename}")
        
        # Step 1: Extract text from document
        doc_data = await document_processor.process_document(tmp_path, doc_type)
        full_text = doc_data["text"]
        
        # Step 2: Extract intelligence (same as audio)
        extraction_result = extraction_pipeline.extract_from_segments([{
            "speaker": "Document",
            "start_time": 0,
            "end_time": 0,
            "text": full_text
        }])
        
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
                "meeting_id": doc_id,
                "created_at": datetime.utcnow().isoformat()
            })
            task["risk_score"] = risk_assessment["risk_score"]
            task["risk_level"] = risk_assessment["risk_level"]
            task["risk_factors"] = risk_assessment["risk_factors"]
            tasks_with_risk.append(risk_assessment)
        
        # Step 4: Persist to PostgreSQL
        meeting_record = Meeting(
            id=uuid.UUID(doc_id),
            title=title or file.filename,
            source_type=doc_type,
            duration_seconds=None,
            transcript_raw=full_text,
            transcript_structured=extraction_result["metadata"],
            document_metadata={
                "pages": doc_data["pages"],
                "sections_count": len(doc_data["sections"]),
                "original_filename": file.filename,
            }
        )
        db.add(meeting_record)
        
        # Create task records
        for task in tasks:
            task_id = uuid.uuid4()
            task_record = Task(
                id=task_id,
                meeting_id=uuid.UUID(doc_id),
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
            neo4j.link_task_to_meeting(str(task_id), doc_id)
            if task.get("assignee"):
                neo4j.create_person_node(task.get("assignee"))
                neo4j.link_task_to_person(str(task_id), task.get("assignee"))
            neo4j.close()
        
        # Create decision records
        for decision in decisions:
            decision_id = uuid.uuid4()
            decision_record = Decision(
                id=decision_id,
                meeting_id=uuid.UUID(doc_id),
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
            neo4j.link_decision_to_meeting(str(decision_id), doc_id)
            neo4j.close()
        
        await db.commit()
        
        # Cleanup
        os.remove(tmp_path)
        
        return {
            "status": "success",
            "document_id": doc_id,
            "title": title or file.filename,
            "document_type": doc_type,
            "pages": doc_data["pages"],
            "tasks_extracted": len(tasks),
            "decisions_extracted": len(decisions),
            "processing_metadata": extraction_result["metadata"]
        }
        
    except Exception as e:
        logger.error(f"Document processing failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")


@router.get("/")
async def list_documents(
    limit: int = 50,
    offset: int = 0,
    source_type: str = None,
    db: AsyncSession = Depends(get_session)
):
    """List all documents with task/decision counts"""
    
    try:
        query = select(Meeting)
        
        if source_type:
            query = query.where(Meeting.source_type == source_type)
        
        result = await db.execute(
            query.limit(limit).offset(offset)
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
                "source_type": meeting.source_type,
                "pages": meeting.document_metadata.get("pages") if meeting.document_metadata else None,
                "created_at": meeting.created_at.isoformat(),
                "tasks_extracted": len(tasks),
                "decisions_extracted": len(decisions)
            })
        
        return response
    except Exception as e:
        logger.error(f"Failed to list documents: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch documents")


@router.get("/{doc_id}")
async def get_document_details(
    doc_id: str,
    db: AsyncSession = Depends(get_session)
):
    """Get document with all extracted intelligence"""
    
    try:
        # Fetch document
        result = await db.execute(
            select(Meeting).where(Meeting.id == doc_id)
        )
        meeting = result.scalar_one_or_none()
        
        if not meeting:
            raise HTTPException(status_code=404, detail="Document not found")
        
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
            "source_type": meeting.source_type,
            "pages": meeting.document_metadata.get("pages") if meeting.document_metadata else None,
            "transcript_raw": meeting.transcript_raw or "",
            "tasks": tasks,
            "decisions": decisions,
            "created_at": meeting.created_at.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get document details: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch document")
