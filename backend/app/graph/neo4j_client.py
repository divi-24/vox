"""
Neo4j graph database client.

Stores:
- Meeting nodes
- Decision nodes
- Task nodes
- Person nodes

Relationships:
- DECIDED_IN: Decision -> Meeting
- ASSIGNED_TO: Task -> Person
- DUE_ON: Task -> Deadline (temporal)
- RELATED_TO: Decision -> Task
- DEPENDS_ON: Task -> Task

Graph enables:
- Decision traceability
- Task dependency analysis
- Risk propagation
- Relationship queries

Ensures idempotency via MERGE operations.
"""

import os
from neo4j import GraphDatabase
from neo4j.exceptions import ServiceUnavailable
import logging
from typing import Dict, List, Any
import json

logger = logging.getLogger(__name__)

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")


class Neo4jClient:
    """Neo4j database client with idempotent operations"""
    
    def __init__(self):
        self.driver = None
    
    def connect(self):
        """Establish connection to Neo4j"""
        try:
            self.driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
            self.driver.verify_connectivity()
            logger.info(f"Connected to Neo4j at {NEO4J_URI}")
            self._init_schema()
        except ServiceUnavailable:
            logger.error(f"Could not connect to Neo4j at {NEO4J_URI}")
            raise
    
    def close(self):
        """Close connection"""
        if self.driver:
            self.driver.close()
            logger.info("Neo4j connection closed")
    
    def _init_schema(self):
        """Initialize schema constraints and indexes"""
        with self.driver.session() as session:
            # Create constraints for uniqueness
            constraints = [
                "CREATE CONSTRAINT meeting_id IF NOT EXISTS FOR (m:Meeting) REQUIRE m.id IS UNIQUE",
                "CREATE CONSTRAINT decision_id IF NOT EXISTS FOR (d:Decision) REQUIRE d.id IS UNIQUE",
                "CREATE CONSTRAINT task_id IF NOT EXISTS FOR (t:Task) REQUIRE t.id IS UNIQUE",
                "CREATE CONSTRAINT person_name IF NOT EXISTS FOR (p:Person) REQUIRE p.name IS UNIQUE",
            ]
            
            for constraint in constraints:
                try:
                    session.run(constraint)
                except Exception as e:
                    # Constraint may already exist
                    logger.debug(f"Schema constraint creation result: {e}")
            
            logger.info("Neo4j schema initialized")
    
    def create_meeting_node(self, meeting_id: str, title: str, metadata: Dict = None) -> bool:
        """Create meeting node (idempotent)"""
        query = """
        MERGE (m:Meeting {id: $meeting_id})
        SET m.title = $title,
            m.created_at = datetime(),
            m.metadata = $metadata
        RETURN m
        """
        
        try:
            with self.driver.session() as session:
                session.run(query, {
                    "meeting_id": meeting_id,
                    "title": title,
                    "metadata": metadata or {}
                })
            logger.info(f"Created meeting node: {meeting_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to create meeting node: {e}")
            return False
    
    def create_decision_node(self, decision_id: str, statement: str, 
                            confidence: float, metadata: Dict = None) -> bool:
        """Create decision node (idempotent)"""
        query = """
        MERGE (d:Decision {id: $decision_id})
        SET d.statement = $statement,
            d.confidence = $confidence,
            d.created_at = datetime(),
            d.metadata = $metadata
        RETURN d
        """
        
        try:
            with self.driver.session() as session:
                session.run(query, {
                    "decision_id": decision_id,
                    "statement": statement,
                    "confidence": confidence,
                    "metadata": metadata or {}
                })
            logger.info(f"Created decision node: {decision_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to create decision node: {e}")
            return False
    
    def create_task_node(self, task_id: str, description: str, 
                        deadline: str = None, metadata: Dict = None) -> bool:
        """Create task node (idempotent)"""
        query = """
        MERGE (t:Task {id: $task_id})
        SET t.description = $description,
            t.deadline = $deadline,
            t.created_at = datetime(),
            t.metadata = $metadata
        RETURN t
        """
        
        try:
            with self.driver.session() as session:
                session.run(query, {
                    "task_id": task_id,
                    "description": description,
                    "deadline": deadline,
                    "metadata": metadata or {}
                })
            logger.info(f"Created task node: {task_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to create task node: {e}")
            return False
    
    def create_person_node(self, name: str, metadata: Dict = None) -> bool:
        """Create person node (idempotent)"""
        query = """
        MERGE (p:Person {name: $name})
        SET p.metadata = $metadata
        RETURN p
        """
        
        try:
            with self.driver.session() as session:
                session.run(query, {
                    "name": name,
                    "metadata": metadata or {}
                })
            logger.info(f"Created person node: {name}")
            return True
        except Exception as e:
            logger.error(f"Failed to create person node: {e}")
            return False
    
    def link_decision_to_meeting(self, decision_id: str, meeting_id: str) -> bool:
        """Link decision to meeting (idempotent)"""
        query = """
        MERGE (d:Decision {id: $decision_id})
        MERGE (m:Meeting {id: $meeting_id})
        MERGE (d)-[r:DECIDED_IN]->(m)
        RETURN r
        """
        
        try:
            with self.driver.session() as session:
                result = session.run(query, {
                    "decision_id": decision_id,
                    "meeting_id": meeting_id
                })
                record = result.single()
                if record:
                    logger.info(f"Linked decision {decision_id} to meeting {meeting_id}")
                    return True
                else:
                    logger.warning(f"Could not link decision {decision_id} to meeting {meeting_id}")
                    return False
        except Exception as e:
            logger.error(f"Failed to link decision to meeting: {e}")
            return False
    
    def link_task_to_person(self, task_id: str, assignee: str) -> bool:
        """Assign task to person (idempotent)"""
        query = """
        MATCH (t:Task {id: $task_id})
        MATCH (p:Person {name: $assignee})
        MERGE (t)-[r:ASSIGNED_TO]->(p)
        RETURN r
        """
        
        try:
            with self.driver.session() as session:
                session.run(query, {
                    "task_id": task_id,
                    "assignee": assignee
                })
            logger.info(f"Assigned task {task_id} to {assignee}")
            return True
        except Exception as e:
            logger.error(f"Failed to assign task: {e}")
            return False
    
    def link_task_to_meeting(self, task_id: str, meeting_id: str) -> bool:
        """Link task to meeting (idempotent)"""
        query = """
        MATCH (t:Task {id: $task_id})
        MATCH (m:Meeting {id: $meeting_id})
        MERGE (t)-[r:CREATED_IN]->(m)
        RETURN r
        """
        
        try:
            with self.driver.session() as session:
                session.run(query, {
                    "task_id": task_id,
                    "meeting_id": meeting_id
                })
            logger.info(f"Linked task {task_id} to meeting {meeting_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to link task to meeting: {e}")
            return False
    
    def query_task_graph(self, task_id: str) -> Dict[str, Any]:
        """Query complete task graph including dependencies and assignee"""
        query = """
        MATCH (t:Task {id: $task_id})
        OPTIONAL MATCH (t)-[rel:DEPENDS_ON|ASSIGNED_TO|CREATED_IN]->(related)
        OPTIONAL MATCH (incoming)-[inrel:DEPENDS_ON]->(t)
        RETURN t, collect({type: type(rel), node: related}) as outgoing,
               collect({type: type(inrel), node: incoming}) as incoming
        """
        
        try:
            with self.driver.session() as session:
                result = session.run(query, {"task_id": task_id})
                return result.single()
        except Exception as e:
            logger.error(f"Failed to query task graph: {e}")
            return None
    
    def query_meeting_decisions(self, meeting_id: str) -> List[Dict]:
        """Get all decisions from a meeting"""
        query = """
        MATCH (m:Meeting {id: $meeting_id})<-[:DECIDED_IN]-(d:Decision)
        OPTIONAL MATCH (d)-[:RELATED_TO]->(t:Task)
        RETURN d, collect(t) as related_tasks
        """
        
        try:
            with self.driver.session() as session:
                result = session.run(query, {"meeting_id": meeting_id})
                return [dict(record) for record in result]
        except Exception as e:
            logger.error(f"Failed to query meeting decisions: {e}")
            return []
