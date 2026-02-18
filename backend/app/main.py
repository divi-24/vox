"""
VoxNote 2.0 Backend
Decision Intelligence Engine

Architecture:
- FastAPI REST API layer
- Hybrid NLP extraction (rule-based + spaCy + LLaMA)
- Neo4j graph persistence
- Deterministic risk engine
- PostgreSQL for metadata

Production-grade async implementation with structured validation.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import meetings, tasks, decisions, graph_api, risk_report, documents
from app.utils.logger import setup_logger
from app.models.database import init_db
from app.graph.neo4j_client import Neo4jClient

# Setup logging
logger = setup_logger(__name__)

# Initialize Neo4j client
neo4j_client = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup/shutdown.
    Handles database initialization and cleanup.
    """
    global neo4j_client
    
    # Startup
    logger.info("VoxNote backend startup sequence initiated")
    try:
        # Initialize PostgreSQL
        await init_db()
        logger.info("PostgreSQL initialized")
        
        # Initialize Neo4j
        neo4j_client = Neo4jClient()
        neo4j_client.connect()
        logger.info("Neo4j connected")
        
    except Exception as e:
        logger.error(f"Startup failed: {e}", exc_info=True)
        raise
    
    yield
    
    # Shutdown
    logger.info("VoxNote backend shutdown sequence initiated")
    try:
        if neo4j_client:
            neo4j_client.close()
        logger.info("Shutdown complete")
    except Exception as e:
        logger.error(f"Shutdown error: {e}", exc_info=True)


# Initialize FastAPI app
app = FastAPI(
    title="VoxNote 2.0 Backend",
    description="Decision Intelligence Engine",
    version="2.0.0",
    lifespan=lifespan
)

# CORS Configuration
# In this dev setup we allow all origins so the Next.js
# frontend can talk to the API from localhost/127.0.0.1.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# No custom middleware needed - FastAPI handles trailing slashes
# The 307 redirects from FastAPI are normal and clients should follow them

# Include routers
app.include_router(meetings.router, prefix="/api/meetings", tags=["meetings"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(decisions.router, prefix="/api/decisions", tags=["decisions"])
app.include_router(graph_api.router, prefix="/api/graph", tags=["graph"])
app.include_router(risk_report.router, prefix="/api/risk", tags=["risk"])


@app.get("/health", tags=["system"])
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": "2.0.0"}


@app.get("/", tags=["system"])
async def root():
    """Root endpoint"""
    return {
        "service": "VoxNote 2.0 Backend",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "api": "/api"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
