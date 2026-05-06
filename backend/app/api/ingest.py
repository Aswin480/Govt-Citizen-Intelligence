from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from typing import List
from app.db.database import get_db
from sqlalchemy.orm import Session
from app.schemas.integration_events import ScrapeJob
from app.workers.scraper_worker import scrape_url
from app.core.celery_app import celery_app
import uuid

router = APIRouter()

@router.post("/ingest/trigger-scrape", status_code=202)
def trigger_scrape(
    job: ScrapeJob,
    db: Session = Depends(get_db)
):
    """
    ENGINE 1.0: Trigger Async Scraping Job (Celery).
    - Checks cache first (TODO)
    - Pushes task to Redis/Celery Queue `scrape_queue`
    - Returns Job ID immediately
    """
    job_id = job.job_id or str(uuid.uuid4())
    
    # Push to Celery
    task = scrape_url.apply_async(
        args=[job_id, job.target_url, job.metadata],
        queue="scrape_queue"
    )
    
    return {
        "status": "queued",
        "job_id": job_id,
        "task_id": task.id,
        "queue": "scrape_queue",
        "engine": "1.0 (Data Acquisition Fabric)"
    }

@router.get("/ingest/status/{task_id}")
def get_scrape_status(task_id: str):
    """
    Monitor scraping task status.
    """
    task_result = celery_app.AsyncResult(task_id)
    return {
        "task_id": task_id,
        "status": task_result.status,
        "result": task_result.result if task_result.ready() else None
    }
