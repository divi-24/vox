# VoxNote Backend — Quick Start

## 60-Second Setup (Docker)

```bash
cd backend
docker-compose up -d
```

That's it. Everything runs:
- PostgreSQL on 5432
- Neo4j on 7687
- Redis on 6379
- FastAPI on 8000

Wait 30 seconds for services to be healthy, then:

```bash
# Check health
curl http://localhost:8000/health

# View API docs
open http://localhost:8000/docs
```

## Manual Setup (5 minutes)

### 1. Create databases
```bash
# PostgreSQL
createdb voxnote

# Neo4j (Docker)
docker run -d -p 7687:7687 -e NEO4J_AUTH=neo4j/password neo4j:5.14-community
```

### 2. Install Python dependencies
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### 3. Configure environment
```bash
cp .env.example .env
# Update DATABASE_URL if needed
```

### 4. Run backend
```bash
python -m uvicorn app.main:app --reload
```

Backend: `http://localhost:8000`
Docs: `http://localhost:8000/docs`

## First Test: Upload Audio

```bash
# Create a test audio file (or use existing one)
curl -X POST "http://localhost:8000/api/meetings/upload" \
  -F "file=@test.wav" \
  -F "title=Test Meeting"
```

Response:
```json
{
  "status": "success",
  "meeting_id": "abc-123-def",
  "tasks_extracted": 5,
  "decisions_extracted": 2
}
```

## Query Extracted Intelligence

```bash
# List all tasks
curl http://localhost:8000/api/tasks

# Get high-risk tasks
curl "http://localhost:8000/api/tasks?risk_level=High"

# Risk dashboard
curl http://localhost:8000/api/risk/summary

# Meeting details with extracted data
curl http://localhost:8000/api/meetings/abc-123-def
```

## Architecture at a Glance

```
Audio
  ↓
Whisper (transcription)
  ↓
Hybrid NLP (rule-based + spaCy + LLaMA)
  ↓
PostgreSQL (metadata) + Neo4j (relationships)
  ↓
Risk Engine (deterministic scoring)
  ↓
REST API (Swagger docs at /docs)
```

## What's Working Now

✅ Audio upload and transcription
✅ Task/decision extraction (hybrid NLP)
✅ Entity normalization
✅ PostgreSQL persistence
✅ Neo4j graph persistence
✅ Deterministic risk scoring
✅ Full REST API
✅ Risk reporting
✅ Graph queries

## What's Optional

⚙️ Ollama/LLaMA validation (works without it, uses fallback scoring)
⚙️ Redis caching (backend works without it)
⚙️ JWT authentication (can be added if needed)

## Common Commands

```bash
# View logs
docker-compose logs -f backend

# Stop everything
docker-compose down

# Rebuild containers
docker-compose build --no-cache

# Access Neo4j browser
open http://localhost:7474

# Access PostgreSQL
psql -U voxnote -d voxnote
```

## Next Steps

1. **Integrate with frontend**: Connect Next.js to FastAPI endpoints
2. **Add authentication**: Implement JWT in API if needed
3. **Fine-tune extraction**: Adjust extraction patterns for your domain
4. **Deploy**: Use docker-compose for staging/production

## Support

Backend is production-ready. Infrastructure is solid. Go build.
