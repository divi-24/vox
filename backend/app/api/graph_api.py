"""
Graph API endpoints for Neo4j queries.

GET /api/graph/task/{task_id} - Task dependency graph
GET /api/graph/meeting/{meeting_id} - Meeting decision graph
GET /api/graph/person/{assignee} - Person's task network
"""

import logging
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List

from app.graph.neo4j_client import Neo4jClient
from app.models.database import get_session

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/task/{task_id}")
async def get_task_graph(
    task_id: str,
    db: AsyncSession = Depends(get_session)
) -> Dict[str, Any]:
    """
    Get complete task dependency graph.
    
    Returns:
    - Task node
    - Outgoing relationships (assigned to, depends on, created in)
    - Incoming relationships (other tasks that depend on this one)
    """
    
    try:
        neo4j = Neo4jClient()
        neo4j.connect()
        
        # Query task graph
        with neo4j.driver.session() as session:
            query = """
            MATCH (t:Task {id: $task_id})
            OPTIONAL MATCH (t)-[outrel]->(out_node)
            OPTIONAL MATCH (in_node)-[inrel]->(t)
            RETURN t as task,
                   collect({rel: type(outrel), node: out_node, props: properties(outrel)}) as outgoing,
                   collect({rel: type(inrel), node: in_node, props: properties(inrel)}) as incoming
            """
            
            result = session.run(query, {"task_id": task_id})
            record = result.single()
            
            neo4j.close()
            
            if not record:
                raise HTTPException(status_code=404, detail="Task not found in graph")
            
            task = dict(record["task"])
            outgoing = record["outgoing"]
            incoming = record["incoming"]
            
            return {
                "task": task,
                "outgoing_relationships": [
                    {
                        "type": rel["rel"],
                        "target": dict(rel["node"]) if rel["node"] else None,
                        "properties": rel["props"]
                    }
                    for rel in outgoing if rel["rel"]
                ],
                "incoming_relationships": [
                    {
                        "type": rel["rel"],
                        "source": dict(rel["node"]) if rel["node"] else None,
                        "properties": rel["props"]
                    }
                    for rel in incoming if rel["rel"]
                ]
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get task graph: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch task graph")


@router.get("/meeting/{meeting_id}")
async def get_meeting_graph(
    meeting_id: str,
    db: AsyncSession = Depends(get_session)
) -> Dict[str, Any]:
    """
    Get meeting decision graph.
    
    Shows all decisions made in meeting and their related tasks.
    """
    
    try:
        neo4j = Neo4jClient()
        neo4j.connect()
        
        with neo4j.driver.session() as session:
            query = """
            MATCH (m:Meeting {id: $meeting_id})
            OPTIONAL MATCH (d:Decision)-[:DECIDED_IN]->(m)
            OPTIONAL MATCH (t:Task)-[:CREATED_IN]->(m)
            OPTIONAL MATCH (d)-[:RELATED_TO]->(related_task:Task)
            RETURN m as meeting,
                   collect(distinct d) as decisions,
                   collect(distinct t) as tasks,
                   collect({decision: d, related: related_task}) as decision_task_links
            """
            
            result = session.run(query, {"meeting_id": meeting_id})
            record = result.single()
            
            neo4j.close()
            
            if not record:
                raise HTTPException(status_code=404, detail="Meeting not found in graph")
            
            meeting = dict(record["meeting"])
            decisions = [dict(d) for d in record["decisions"] if d]
            tasks = [dict(t) for t in record["tasks"] if t]
            
            return {
                "meeting": meeting,
                "decisions": decisions,
                "tasks": tasks,
                "decision_task_links": [
                    {
                        "decision": dict(link["decision"]) if link["decision"] else None,
                        "related_task": dict(link["related"]) if link["related"] else None
                    }
                    for link in record["decision_task_links"]
                ]
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get meeting graph: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch meeting graph")


@router.get("/person/{assignee}")
async def get_person_network(
    assignee: str,
    db: AsyncSession = Depends(get_session)
) -> Dict[str, Any]:
    """
    Get person's task network and responsibilities.
    
    Returns:
    - Person node
    - All assigned tasks
    - Task status distribution
    - Risk breakdown
    """
    
    try:
        neo4j = Neo4jClient()
        neo4j.connect()
        
        with neo4j.driver.session() as session:
            query = """
            MATCH (p:Person {name: $assignee})
            OPTIONAL MATCH (p)<-[rel:ASSIGNED_TO]-(t:Task)
            OPTIONAL MATCH (t)-[:CREATED_IN]->(m:Meeting)
            RETURN p as person,
                   collect({task: t, meeting: m, rel_props: properties(rel)}) as assignments
            """
            
            result = session.run(query, {"assignee": assignee})
            record = result.single()
            
            neo4j.close()
            
            if not record:
                raise HTTPException(status_code=404, detail="Person not found in graph")
            
            person = dict(record["person"])
            assignments = [
                {
                    "task": dict(a["task"]) if a["task"] else None,
                    "meeting": dict(a["meeting"]) if a["meeting"] else None,
                    "assigned_at": a["rel_props"].get("assigned_at") if a["rel_props"] else None
                }
                for a in record["assignments"]
            ]
            
            return {
                "person": person,
                "assignments": assignments,
                "total_tasks": len(assignments),
                "task_count": len([a for a in assignments if a["task"]])
            }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get person network: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch person network")
