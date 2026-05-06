from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.system import SystemConfig
from pydantic import BaseModel
from typing import List, Optional
import json
import os
import time

router = APIRouter()

# Schema
class ConfigUpdate(BaseModel):
    key: str
    value: str
    description: Optional[str] = None
    is_draft: bool = False

class ConfigResponse(BaseModel):
    key: str
    value: str
    description: Optional[str] = None

# Routes

@router.get("/", response_model=List[ConfigResponse])
def get_system_config(
    mode: str = Query("live", regex="^(live|draft)$"),
    db: Session = Depends(get_db)
):
    """
    Get system settings.
    - mode='live': Returns confirmed public settings.
    - mode='draft': Returns live settings overlaid with any draft changes (for Admin Preview).
    """
    try:
        all_configs = db.query(SystemConfig).all()
        
        # 1. Build Dictionary of Live Configs
        final_config = {}
        draft_config = {}
        
        for c in all_configs:
            if c.key.startswith("draft_"):
                real_key = c.key.replace("draft_", "", 1)
                draft_config[real_key] = c
            else:
                final_config[c.key] = c
                
        # 2. If Draft Mode, Overlay Drafts
        if mode == "draft":
            for k, v in draft_config.items():
                final_config[k] = v # Overwrite live with draft
                
        # 3. Convert back to list
        return [
            ConfigResponse(key=k, value=v.value, description=v.description) 
            for k, v in final_config.items()
        ]
    except Exception as e:
        print(f"Error loading system config: {e}")
        return []

@router.put("/", response_model=ConfigResponse)
def update_system_config(
    item: ConfigUpdate,
    db: Session = Depends(get_db),
):
    """
    Update a setting.
    If is_draft=True, it saves to a 'draft_' key, invisible to public.
    """
    target_key = f"draft_{item.key}" if item.is_draft else item.key
    
    config = db.query(SystemConfig).filter(SystemConfig.key == target_key).first()
    
    if not config:
        config = SystemConfig(key=target_key, value=item.value, description=item.description)
        db.add(config)
    else:
        config.value = item.value
        if item.description:
            config.description = item.description
    
    db.commit()
    db.refresh(config)
    
    # Return as if it were the normal key for frontend consistency
    return ConfigResponse(key=item.key, value=config.value, description=config.description)

@router.post("/publish")
def publish_release(
    db: Session = Depends(get_db)
):
    """
    Promotes all 'draft_' configs to Live.
    Creates a JSON backup of the pre-publish state.
    """
    # 1. Fetch all drafts
    drafts = db.query(SystemConfig).filter(SystemConfig.key.like("draft_%")).all()
    
    if not drafts:
        return {"status": "no_changes", "message": "No draft changes found to publish."}

    # 2. Create Backup of Live State
    live_configs = db.query(SystemConfig).filter(SystemConfig.key.notlike("draft_%")).all()
    backup_data = {c.key: c.value for c in live_configs}
    
    backup_dir = "backups/releases"
    os.makedirs(backup_dir, exist_ok=True)
    timestamp = int(time.time())
    with open(f"{backup_dir}/release_v{timestamp}.json", "w") as f:
        json.dump(backup_data, f, indent=2)

    # 3. Apply Drafts to Live
    count = 0
    for draft in drafts:
        real_key = draft.key.replace("draft_", "", 1)
        
        # Find or Create Live Key
        live = db.query(SystemConfig).filter(SystemConfig.key == real_key).first()
        if not live:
            live = SystemConfig(key=real_key, value=draft.value, description=draft.description)
            db.add(live)
        else:
            live.value = draft.value
            live.description = draft.description
        
        # Optional: Delete draft after publish? 
        # Usually better to keep it as "synced" or delete to show "clean slate".
        # Let's delete draft row to indicate "No Pending Changes".
        db.delete(draft)
        count += 1
        
    db.commit()
    
    return {
        "status": "published",
        "changes_count": count,
        "backup_file": f"release_v{timestamp}.json"
    }

@router.post("/reset-drafts")
def discard_drafts(db: Session = Depends(get_db)):
    """
    Discards all pending drafts. Reverts Admin View to Live.
    """
    db.query(SystemConfig).filter(SystemConfig.key.like("draft_%")).delete(synchronize_session=False)
    db.commit()
    return {"status": "cleared"}

@router.get("/{key}", response_model=ConfigResponse)
def get_config_key(key: str, db: Session = Depends(get_db)):
    config = db.query(SystemConfig).filter(SystemConfig.key == key).first()
    if not config:
        raise HTTPException(status_code=404, detail="Config key not found")
    return config

# --- SCRAPING CONTROLS (Dynamic Engine Setup) ---
from app.services.scraper_service import run_admin_scraping_job

class ScrapeRequest(BaseModel):
    url: str
    schema_description: Optional[str] = "key entities and data"
    force_ai: bool = True

@router.post("/scrape/run")
def trigger_scraping_job(
    job: ScrapeRequest,
    db: Session = Depends(get_db)
):
    """
    Triggers the Elite Scraping Engine for a specific target.
    This allows Admin to dynamically setup and test scraping sources.
    """
    try:
        results = run_admin_scraping_job({
            "url": job.url,
            "schema": job.schema_description,
            "force_ai": job.force_ai
        })
        return {"status": "success", "datasets": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- JOB MANAGEMENT (Continuous Loop) ---
from app.models.scraper_job import ScraperJob

class JobCreate(BaseModel):
    url: str
    name: Optional[str]
    frequency_seconds: int = 300
    schema_prompt: Optional[str] = "key entities"
    force_ai: bool = False

@router.post("/scrape/jobs")
def create_scraper_job(job: JobCreate, db: Session = Depends(get_db)):
    """Registers a new Continuous Scraping Source."""
    existing = db.query(ScraperJob).filter(ScraperJob.url == job.url).first()
    if existing:
        raise HTTPException(status_code=400, detail="URL already exists in job queue")
    
    new_job = ScraperJob(
        url=job.url,
        name=job.name or job.url,
        frequency_seconds=job.frequency_seconds,
        schema_prompt=job.schema_prompt,
        force_ai=job.force_ai
    )
    db.add(new_job)
    db.commit()
    return {"status": "registered", "id": new_job.id}

@router.get("/scrape/jobs")
def list_scraper_jobs(db: Session = Depends(get_db)):
    """
    Returns all active continuous scraping jobs with basic health status.
    """
    jobs = db.query(ScraperJob).all()
    return [{
        "id": j.id,
        "name": j.name,
        "url": j.url,
        "status": j.last_status,
        "health_score": j.health_score,
        "last_run": j.last_run_at,
        "frequency": j.frequency_seconds,
        "is_active": j.is_active
    } for j in jobs]

@router.get("/scrape/jobs/{job_id}/diagnostics")
def get_job_diagnostics(job_id: int, db: Session = Depends(get_db)):
    """
    Returns the full Elite Diagnostics for a specific job.
    Includes: Selector Registry, Provenance Meta, Latency stats.
    """
    job = db.query(ScraperJob).filter(ScraperJob.id == job_id).first()
    if not job: raise HTTPException(404, "Job not found")
    
    return {
        "id": job.id,
        "name": job.name,
        "health_score": job.health_score,
        "avg_latency_ms": job.avg_latency_ms,
        "consecutive_failures": job.consecutive_failures,
        "selector_registry": job.selector_registry,
        "provenance_meta": job.provenance_meta,
        "last_error": job.last_error
    }

@router.post("/scrape/jobs/{job_id}/toggle")
def toggle_job_status(job_id: int, db: Session = Depends(get_db)):
    job = db.query(ScraperJob).filter(ScraperJob.id == job_id).first()
    if not job: raise HTTPException(404, "Job not found")
    job.is_active = not job.is_active
    db.commit()
    return {"status": "updated", "is_active": job.is_active}
