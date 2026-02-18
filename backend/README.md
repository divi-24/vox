# VoxNote 2.0 Backend

Decision Intelligence Engine — Production-grade backend for meeting transcription, intelligent extraction, and accountability tracking.

## Architecture

```
Audio Upload
    ↓
Faster-Whisper (Transcription)
    ↓
Hybrid NLP Pipeline (Rule-based + spaCy + LLaMA)
    ↓
Entity Normalization + Validation
    ↓
PostgreSQL (Metadata) + Neo4j (Relationships)
    ↓
Risk Assessment Engine (Deterministic scoring)
    ↓
REST API + Graph Queries
```

## Key Features

### 1. Audio Transcription
- Async processing with `faster-whisper`
- Speaker diarization (basic)
- Timestamped segments
- Memory-efficient chunked handling

### 2. Hybrid NLP Extraction
**Why hybrid over pure LLM:**
- **Rule-based** (Fast): Detect keywords like "will", "assigned to", "deadline"
- **spaCy** (Structural): NER + dependency parsing for entity extraction
- **LLaMA** (Validation): Confidence scoring only for ambiguous cases
- **No hallucinations.** No API costs. High performance.

Extracts:
- **Tasks**: Description, assignee, deadline
- **Decisions**: Statement, confidence score

### 3. Neo4j Graph Database
Structured relationships:
```
(:Meeting) -[DECIDED_IN]-> (:Decision)
(:Task) -[ASSIGNED_TO]-> (:Person)
(:Task) -[CREATED_IN]-> (:Meeting)
(:Task) -[DEPENDS_ON]-> (:Task)
```

Enables:
- Decision traceability
- Task dependency analysis
- Risk propagation
- Complex relationship queries

### 4. Deterministic Risk Engine
Every risk point is **explainable**:

```
Risk Factors (Deterministic scoring):
- No assignee → +30 points
- No deadline → +25 points
- Negative sentiment → +20 points
- Repeated topic → +15 points
- Historical delays → +10 points

Risk Levels:
0-30: Low (Green)
31-60: Medium (Yellow)
61-85: High (Orange)
86-100: Critical (Red)
```

No black-box ML. Every risk score has a reason.

### 5. REST API

#### Meetings
```
POST /api/meetings/upload - Upload audio file
GET /api/meetings - List meetings
GET /api/meetings/{id} - Meeting details with extracted intelligence
```

#### Tasks
```
GET /api/tasks - List tasks (with filtering)
GET /api/tasks/{id} - Task details
GET /api/tasks/overdue - Overdue tasks
PUT /api/tasks/{id} - Update task status
```

#### Decisions
```
GET /api/decisions - List decisions
GET /api/decisions/{id} - Decision details
```

#### Risk Reports
```
GET /api/risk/summary - Aggregate risk dashboard
GET /api/risk/by-assignee - Risk breakdown
GET /api/risk/timeline - Risk trends over time
```

#### Graph Queries
```
GET /api/graph/task/{id} - Task dependency graph
GET /api/graph/meeting/{id} - Meeting decision graph
GET /api/graph/person/{name} - Person's task network
```

## Setup

### Prerequisites
- Python 3.11+
- PostgreSQL 14+
- Neo4j 5+
- Docker & Docker Compose (optional)
- Ollama (optional, for LLaMA validation)

### Local Setup

1. **Clone and install**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
```

2. **Download spaCy model**
```bash
python -m spacy download en_core_web_sm
```

3. **Setup databases**
```bash
# PostgreSQL (create database manually or use Docker)
createdb voxnote

# Neo4j (use Docker or local installation)
docker run -d -p 7687:7687 -p 7474:7474 -e NEO4J_AUTH=neo4j/password neo4j:5.14-community
```

4. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

5. **Run backend**
```bash
python -m uvicorn app.main:app --reload
```

Backend available at `http://localhost:8000`
API docs: `http://localhost:8000/docs`

### Docker Setup (Recommended)

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Neo4j on port 7687 (bolt) and 7474 (web)
- Redis on port 6379
- FastAPI backend on port 8000

View logs:
```bash
docker-compose logs -f backend
```

## Usage

### Upload Meeting
```bash
curl -X POST "http://localhost:8000/api/meetings/upload" \
  -F "file=@meeting.wav" \
  -F "title=Q1 Planning"
```

Response:
```json
{
  "status": "success",
  "meeting_id": "abc-123",
  "title": "Q1 Planning",
  "duration_seconds": 3600,
  "segments": 45,
  "tasks_extracted": 12,
  "decisions_extracted": 5
}
```

### Query Tasks
```bash
# Get high-risk tasks
curl "http://localhost:8000/api/tasks?risk_level=High"

# Get tasks assigned to person
curl "http://localhost:8000/api/tasks?assignee=Rahul"

# Get overdue tasks
curl "http://localhost:8000/api/tasks/overdue"
```

### Risk Dashboard
```bash
curl "http://localhost:8000/api/risk/summary"
```

Response:
```json
{
  "total_tasks": 50,
  "critical_count": 3,
  "high_count": 8,
  "medium_count": 20,
  "low_count": 19,
  "average_risk_score": 42.5,
  "risk_breakdown_percentage": {
    "critical": 6.0,
    "high": 16.0,
    "medium": 40.0,
    "low": 38.0
  }
}
```

## Architecture Decisions

### Why Hybrid NLP?
Pure LLM extraction is:
- Slow (API latency)
- Expensive (per-token cost)
- Prone to hallucinations
- Not reproducible

Hybrid approach:
- Rule-based catches 80% instantly
- spaCy provides linguistic structure
- LLaMA validates only ambiguous cases
- Deterministic, fast, cheap

### Why Graph Database?
Relational schema can't express:
- Arbitrary task dependencies
- Decision relationships
- Changing team structures
- Complex accountability chains

Neo4j enables:
- Flexible relationship modeling
- Efficient subgraph queries
- Pattern matching (Cypher)
- Visualization-friendly

### Why Deterministic Risk?
Black-box risk models:
- Can't be explained to team
- Hard to debug
- Don't build trust
- May encode bias

Deterministic scoring:
- Every point has a reason
- Transparent to users
- Actionable feedback
- Can adjust thresholds

## Performance

- Audio transcription: ~2-5x real-time (depends on hardware)
- NLP extraction: ~500ms per hour of audio
- Risk assessment: ~10ms per task
- Graph queries: <100ms for typical queries

## Troubleshooting

### PostgreSQL connection refused
```bash
# Check if PostgreSQL is running
psql -U voxnote -d voxnote -c "SELECT 1"

# Or use Docker
docker run -d -e POSTGRES_PASSWORD=voxnote_dev postgres:16-alpine
```

### Neo4j connection refused
```bash
# Check if Neo4j is running
docker ps | grep neo4j

# Or start Neo4j
docker run -d -p 7687:7687 neo4j:5.14-community
```

### Whisper model not downloading
```bash
# Download manually
python -c "from faster_whisper import WhisperModel; WhisperModel('base')"
```

### Out of memory during transcription
```bash
# Use smaller model
WHISPER_MODEL_SIZE=tiny python -m uvicorn app.main:app
```

## Development

### Run tests
```bash
pytest tests/ -v
```

### Code formatting
```bash
black app/
ruff check app/
mypy app/
```

### Database migrations (Alembic)
```bash
alembic upgrade head
alembic revision --autogenerate -m "Description"
```

## Production Checklist

- [ ] Set `ENVIRONMENT=production`
- [ ] Generate strong `SECRET_KEY`
- [ ] Configure proper database backups
- [ ] Set up monitoring/logging
- [ ] Configure CORS properly
- [ ] Use HTTPS in production
- [ ] Set resource limits on containers
- [ ] Configure rate limiting
- [ ] Add authentication/authorization
- [ ] Test disaster recovery

## License

Proprietary — VoxNote 2.0

## Support

For issues or questions, contact engineering team.
