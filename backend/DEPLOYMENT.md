# VoxNote Backend — Deployment Guide

Production deployment checklist and instructions.

## Pre-Deployment Checklist

### Code
- [ ] All tests passing: `pytest tests/ -v`
- [ ] Code formatted: `black app/` + `ruff check app/`
- [ ] No type errors: `mypy app/`
- [ ] All secrets in `.env`, not in code
- [ ] No debug logging in production
- [ ] Error handling complete

### Infrastructure
- [ ] PostgreSQL backed up and tested
- [ ] Neo4j backed up and tested
- [ ] Redis backed up and tested
- [ ] Firewall rules configured
- [ ] SSL certificates ready
- [ ] Domain/IP ready

### Documentation
- [ ] API docs generated
- [ ] Runbook written
- [ ] On-call procedures documented
- [ ] Rollback plan documented

## Environment Setup

### Production .env
```bash
# Copy and customize
cp .env.example .env.production

# Edit these:
ENVIRONMENT=production
SECRET_KEY=<generate-strong-key>
DATABASE_URL=postgresql+asyncpg://user:pass@prod-db:5432/voxnote
NEO4J_URI=bolt://prod-neo4j:7687
NEO4J_PASSWORD=<strong-password>
LOG_LEVEL=INFO
```

### Generate Secret Key
```python
import secrets
print(secrets.token_urlsafe(32))
```

## Deployment Methods

### Option 1: Docker Compose (Recommended for Small Teams)

```bash
# Build production image
docker build -t voxnote-backend:latest .

# Deploy
docker-compose -f docker-compose.yml up -d

# View logs
docker-compose logs -f backend

# Scale workers
docker-compose up -d --scale backend=3
```

### Option 2: Kubernetes

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: voxnote-backend
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: backend
        image: voxnote-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: voxnote-secrets
              key: database-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
```

Deploy:
```bash
kubectl create secret generic voxnote-secrets \
  --from-env-file=.env.production

kubectl apply -f deployment.yaml

# Verify
kubectl get pods
kubectl logs -f deployment/voxnote-backend
```

### Option 3: Cloud Platform (AWS/GCP/Azure)

**AWS Elastic Container Service (ECS):**
```bash
# Create ECR repository
aws ecr create-repository --repository-name voxnote-backend

# Push image
docker tag voxnote-backend:latest <account>.dkr.ecr.<region>.amazonaws.com/voxnote-backend:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/voxnote-backend:latest

# Create ECS task definition and service
# (Use AWS console or CDK)
```

**Google Cloud Run:**
```bash
gcloud run deploy voxnote-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --set-env-vars DATABASE_URL=postgresql://... \
  --allow-unauthenticated
```

## Database Migrations

### Initialize
```bash
# Create migration scripts
alembic upgrade head
```

### In Production
```bash
# Test migrations locally first
docker exec voxnote-postgres pg_dump voxnote > backup.sql

# Run migrations
alembic upgrade head

# Monitor logs
docker-compose logs -f backend
```

## Monitoring

### Health Checks
```bash
# Continuous monitoring
watch -n 5 "curl -s http://localhost:8000/health | jq ."
```

### Logs
```bash
# Aggregate logs
docker-compose logs backend | grep ERROR

# Real-time monitoring
docker-compose logs -f --tail=100 backend
```

### Metrics (Optional)
Add Prometheus monitoring:
```bash
# Install prometheus middleware
pip install prometheus-fastapi-instrumentator

# Enable in main.py
from prometheus_fastapi_instrumentator import Instrumentator
Instrumentator().instrument(app).expose(app)

# Metrics at /metrics
```

### Database Health
```bash
# PostgreSQL
docker exec voxnote-postgres pg_isready

# Neo4j
curl http://localhost:7474/db/neo4j/metrics
```

## Scaling

### Horizontal Scaling
```bash
# Run multiple backend instances
docker-compose up -d --scale backend=3

# Use load balancer (nginx)
upstream backend {
    server backend_1:8000;
    server backend_2:8000;
    server backend_3:8000;
}

server {
    listen 80;
    location / {
        proxy_pass http://backend;
    }
}
```

### Vertical Scaling
```bash
# Increase container resources
docker update \
  --memory=2g \
  --cpus=2 \
  voxnote-backend
```

### Database Scaling
```sql
-- PostgreSQL: Add read replicas
-- Neo4j: Configure causal clustering

-- Index frequently queried columns
CREATE INDEX idx_task_status ON tasks(status);
CREATE INDEX idx_task_assignee ON tasks(assignee);
CREATE INDEX idx_task_risk_level ON tasks(risk_level);
```

## Backup & Recovery

### Automated Backups
```bash
# PostgreSQL backup script
#!/bin/bash
docker exec voxnote-postgres pg_dump -U voxnote voxnote | \
  gzip > /backups/voxnote_$(date +%Y%m%d_%H%M%S).sql.gz

# Neo4j backup
docker exec voxnote-neo4j cypher-shell \
  -u neo4j -p password \
  "CALL apoc.export.cypher.all('/var/lib/neo4j/backup.cypher')"

# Schedule with cron
0 2 * * * /scripts/backup.sh
```

### Recovery
```bash
# PostgreSQL restore
docker exec voxnote-postgres psql -U voxnote voxnote < backup.sql

# Neo4j restore
docker exec voxnote-neo4j cypher-shell -u neo4j -p password < backup.cypher
```

## Rollback Plan

### If Deployment Fails
```bash
# Immediately rollback
docker-compose down
docker pull voxnote-backend:<previous-version>
docker-compose up -d

# Verify health
curl http://localhost:8000/health
```

### Database Rollback
```bash
# Restore from backup
docker exec voxnote-postgres psql -U voxnote voxnote < backup.sql

# Test connectivity
docker-compose exec backend python -c "from app.models.database import init_db; init_db()"
```

## Performance Optimization

### Database
```sql
-- Add indexes
CREATE INDEX idx_meetings_created ON meetings(created_at DESC);
CREATE INDEX idx_tasks_status_risk ON tasks(status, risk_level);
CREATE INDEX idx_decisions_confidence ON decisions(confidence_score DESC);

-- Analyze query plans
EXPLAIN ANALYZE SELECT * FROM tasks WHERE status='pending' AND risk_level='High';
```

### API Caching
```python
# Add Redis caching to expensive endpoints
from fastapi_cache2 import FastAPICache2
from fastapi_cache2.backends.redis import RedisBackend
from fastapi_cache2.decorators import cache

@router.get("/risk/summary")
@cache(expire=300)  # Cache for 5 minutes
async def get_risk_summary():
    ...
```

### Connection Pooling
```python
# Increase pool size for high-concurrency
engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=40,
    pool_recycle=3600  # Recycle connections hourly
)
```

## Monitoring & Alerts

### Set Up Alerts
```bash
# Alert on high error rate
# Alert on database connection failures
# Alert on disk space
# Alert on memory usage

# Use services like:
# - DataDog
# - New Relic
# - CloudWatch (AWS)
# - Stackdriver (GCP)
```

### Key Metrics to Monitor
- API response times
- Error rate (5xx responses)
- Database connection pool usage
- CPU/Memory usage
- Task processing latency
- Risk engine computation time

## Maintenance

### Weekly
- [ ] Check logs for errors
- [ ] Verify backup success
- [ ] Monitor database size

### Monthly
- [ ] Update dependencies: `pip install --upgrade -r requirements.txt`
- [ ] Review and optimize slow queries
- [ ] Check security advisories

### Quarterly
- [ ] Load testing
- [ ] Disaster recovery drill
- [ ] Capacity planning review

## On-Call Runbook

### If Backend is Down
1. Check health: `curl http://localhost:8000/health`
2. Check logs: `docker-compose logs backend`
3. Check database connection: `docker-compose exec backend python -c "import app.models.database"`
4. Restart service: `docker-compose restart backend`
5. If still failing, rollback to previous version

### If Database is Down
1. Check PostgreSQL: `docker-compose logs postgres`
2. Check Neo4j: `docker-compose logs neo4j`
3. Attempt recovery from backup
4. If unrecoverable, trigger disaster recovery

### If API is Slow
1. Check database slow queries log
2. Check Neo4j query performance
3. Analyze CPU/memory usage
4. Scale up if needed

## Cost Optimization

- Use ARM64 instances if available (cheaper)
- Right-size database instances
- Enable auto-scaling based on metrics
- Clean up old logs and backups
- Use spot/preemptible instances for non-critical workloads

## Security in Production

- [ ] Enable HTTPS/TLS
- [ ] Rotate secrets monthly
- [ ] Enable database encryption at rest
- [ ] Enable audit logging
- [ ] Set up WAF (Web Application Firewall)
- [ ] Regular security scans
- [ ] Keep dependencies updated
- [ ] Implement rate limiting

## Communication Plan

- Notify team before deployment
- Document deployment time
- Have rollback ready
- Monitor for issues immediately after
- Post-deployment review

---

**VoxNote Backend Deployment** — Production Ready
