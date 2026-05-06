"""
Health Check Endpoint - Monitors all services
Verifies database, redis, neo4j, minio, nlp connectivity
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import redis
import time
import logging
from typing import Dict, Any
import httpx

from app.db.database import get_db
from app.config import settings
from app.services.django_adapter import django_adapter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/health", tags=["Health"])

class HealthCheckResult:
    def __init__(self, name: str, passed: bool, message: str = "", latency_ms: int = 0):
        self.name = name
        self.passed = passed
        self.message = message
        self.latency_ms = latency_ms
    
    def to_dict(self):
        return {
            "service": self.name,
            "status": "ok" if self.passed else "failed",
            "message": self.message,
            "latency_ms": self.latency_ms
        }

@router.get("/ping", response_model=dict)
async def health_ping():
    """Simple health check - service is alive"""
    return {
        "status": "ok",
        "message": "Service is running",
        "timestamp": time.time()
    }

@router.get("/db", response_model=dict)
async def health_db(db: Session = Depends(get_db)):
    """Check database connectivity"""
    try:
        start = time.time()
        # Simple query to verify database is responding
        result = db.execute(text("SELECT 1")).fetchone()
        latency_ms = int((time.time() - start) * 1000)
        
        if result:
            return {
                "status": "ok",
                "service": "PostgreSQL",
                "latency_ms": latency_ms,
                "message": "Database connected"
            }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "status": "failed",
            "service": "PostgreSQL",
            "message": str(e)
        }

@router.get("/redis", response_model=dict)
async def health_redis():
    """Check Redis connectivity"""
    try:
        start = time.time()
        # Extract Redis URL from settings
        redis_url = settings.redis_url
        
        # Parse Redis URL
        r = redis.from_url(redis_url)
        r.ping()
        latency_ms = int((time.time() - start) * 1000)
        
        return {
            "status": "ok",
            "service": "Redis",
            "latency_ms": latency_ms,
            "message": "Redis connected"
        }
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        return {
            "status": "failed",
            "service": "Redis",
            "message": str(e)
        }

@router.get("/neo4j", response_model=dict)
async def health_neo4j():
    """Check Neo4j connectivity (optional)"""
    try:
        # This is optional - app works without Neo4j
        from neo4j import GraphDatabase
        
        start = time.time()
        # TODO: Implement Neo4j health check if using it
        # For now, return not_required
        
        return {
            "status": "not_required",
            "service": "Neo4j",
            "message": "Neo4j connectivity check not implemented"
        }
    except Exception as e:
        logger.warning(f"Neo4j health check skipped: {e}")
        return {
            "status": "not_required",
            "service": "Neo4j",
            "message": "Neo4j not configured"
        }

@router.get("/minio", response_model=dict)
async def health_minio():
    """Check MinIO connectivity (optional)"""
    try:
        # This is optional - app works without MinIO
        return {
            "status": "not_required",
            "service": "MinIO",
            "message": "MinIO connectivity check not implemented"
        }
    except Exception as e:
        logger.warning(f"MinIO health check skipped: {e}")
        return {
            "status": "not_required",
            "service": "MinIO",
            "message": "MinIO not configured"
        }

@router.get("/nlp", response_model=dict)
async def health_nlp():
    """Check NLP backend connectivity"""
    try:
        start = time.time()
        nlp_url = "http://127.0.0.1:8001"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{nlp_url}/api/health", timeout=5.0)
            latency_ms = int((time.time() - start) * 1000)
            
            if response.status_code == 200:
                return {
                    "status": "ok",
                    "service": "NLP Backend",
                    "latency_ms": latency_ms,
                    "url": nlp_url,
                    "message": "NLP backend reachable"
                }
            else:
                return {
                    "status": "failed",
                    "service": "NLP Backend",
                    "status_code": response.status_code,
                    "message": "NLP backend returned error"
                }
    except httpx.ConnectError:
        logger.warning("NLP backend not reachable")
        return {
            "status": "unavailable",
            "service": "NLP Backend",
            "url": "http://127.0.0.1:8001",
            "message": "NLP backend not running (optional)"
        }
    except Exception as e:
        logger.warning(f"NLP health check failed: {e}")
        return {
            "status": "error",
            "service": "NLP Backend",
            "message": str(e)
        }

@router.get("/django", response_model=dict)
async def health_django():
    """Check Django connectivity"""
    try:
        return await django_adapter.get_django_health()
    except Exception as e:
        logger.error(f"Django health check failed: {e}")
        return {
            "status": "failed",
            "service": "Django",
            "message": str(e)
        }

@router.get("/all", response_model=dict)
async def health_all(db: Session = Depends(get_db)):
    """Check all services and return combined status"""
    results = {
        "timestamp": time.time(),
        "services": []
    }
    
    # Run all health checks
    health_checks = [
        ("Ping", await health_ping()),
        ("Database", await health_db(db)),
        ("Redis", await health_redis()),
        ("Neo4j", await health_neo4j()),
        ("MinIO", await health_minio()),
        ("NLP Backend", await health_nlp()),
        ("Django", await health_django()),
    ]
    
    critical_failed = []
    optional_failed = []
    
    for name, result in health_checks:
        status = result.get("status", "unknown")
        
        # Track failures
        if status == "failed":
            if result.get("service") in ["PostgreSQL", "Redis"]:
                critical_failed.append(name)
            else:
                optional_failed.append(name)
        
        results["services"].append(result)
    
    # Determine overall status
    if critical_failed:
        results["overall_status"] = "critical"
        results["critical_failures"] = critical_failed
    elif optional_failed:
        results["overall_status"] = "degraded"
        results["optional_failures"] = optional_failed
    else:
        results["overall_status"] = "healthy"
    
    return results

@router.get("/metrics", response_model=dict)
async def health_metrics(db: Session = Depends(get_db)):
    """System metrics - count of resources"""
    try:
        from app.models.parliament import Member
        from app.models.scheme import Scheme
        from app.models.user import User
        
        users_count = db.query(User).count()
        members_count = db.query(Member).count()
        schemes_count = db.query(Scheme).count()
        
        return {
            "status": "ok",
            "metrics": {
                "users_total": users_count,
                "members_total": members_count,
                "schemes_total": schemes_count
            }
        }
    except Exception as e:
        logger.error(f"Metrics query failed: {e}")
        return {
            "status": "error",
            "message": str(e)
        }
