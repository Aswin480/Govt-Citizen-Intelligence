import time
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import hashlib
import json

# Import Service Functions directly
from app.services.sentiment_model import analyze_aspect_sentiment
from app.services.extractor_engine import EliteScraperEngine
from app.models.scraper_job import ScraperJob

# topic_modeling might not be fully active if user disabled bertopic, handling gracefully
try:
    from app.services.topic_modeling import run_topic_modeling
except ImportError:
    run_topic_modeling = None

def get_data_hash(datasets):
    """Generates a hash of the dataset to detect changes."""
    return hashlib.md5(json.dumps(datasets, sort_keys=True).encode()).hexdigest()

def execute_continuous_extraction(db: Session, engine: EliteScraperEngine):
    """
    The Core Loop for "Best in World" Continuous Fetching.
    """
    print("🕸️ [SCRAPER] Checking for active jobs...")
    jobs = db.query(ScraperJob).filter(ScraperJob.is_active == True).all()
    
    for job in jobs:
        # Check frequency & Schedule Logic
        now = datetime.now() # Local/Server Time
        is_daily_job = job.frequency_seconds >= 80000 # Approx 24h

        # USER REQUEST: "Every 23:59 hr it should re run and update"
        if is_daily_job:
            # Only run if it's 23:59 AND hasn't run today yet
            if now.hour == 23 and now.minute >= 59:
                if job.last_run_at and job.last_run_at.date() == now.date():
                    continue # Already ran today's closing cycle
                print(f"🌙 [SCRAPER] 23:59 Nightly Sync Triggered for: {job.name}")
            else:
                continue # Wait for 23:59
        
        # Standard Interval Check for High-Frequency Jobs (Hourly, etc)
        elif job.last_run_at:
            next_run = job.last_run_at + timedelta(seconds=job.frequency_seconds)
            if datetime.utcnow() < next_run:
                continue # Skip if too soon

        print(f"🚀 [SCRAPER] Running Job: {job.name or job.url}")
        try:
            # Execute with Best-Class Engine
            result = engine.run_dynamic({
                "url": job.url,
                "target_schema": job.schema_prompt,
                "force_ai": job.force_ai
            })

            success = result['status'] == 'success'
            job.last_run_at = datetime.utcnow()
            job.last_status = "success" if success else "error"
            
            # SELF-DEFENSE: CIRCUIT BREAKER
            if success:
                # Reset counters on success
                job.consecutive_failures = 0
                job.health_score = min(100.0, job.health_score + 5) # Slowly recover trust
                
                # Change Detection Logic
                new_hash = get_data_hash(result['datasets'])
                if new_hash != job.last_data_hash:
                    print(f"🌟 [SCRAPER] NEW DATA DETECTED for {job.url}!")
                    job.last_data_hash = new_hash
                    job.total_datasets_found = len(result['datasets'])
                else:
                    print(f"💤 [SCRAPER] No changes for {job.url}")
            else:
                # FAILURE LOGIC
                job.last_error = result.get('message', 'Unknown Error')
                job.consecutive_failures = (job.consecutive_failures or 0) + 1
                job.health_score = max(0.0, (job.health_score or 100) - 10) # Penalty
                
                print(f"⚠️ [DEFENSE] Job Failed {job.consecutive_failures} times in a row. Health: {job.health_score}%")
                
                # KILL SWITCH (Panic Mode)
                if job.consecutive_failures >= 5:
                    print(f"🛑 [DEFENSE] CIRCUIT BREAKER TRIGGERED! Disabling {job.url} to prevent IP Ban.")
                    job.is_active = False 
                    job.last_error = "CIRCUIT BREAKER: Disabled after 5 consecutive failures."

            db.commit()

        except Exception as e:
            print(f"❌ [SCRAPER] Job Crashing: {e}")
            job.last_status = "crash"
            job.consecutive_failures = (job.consecutive_failures or 0) + 1
            if job.consecutive_failures >= 5:
                job.is_active = False # Kill it
            db.commit()


def scheduled_nlp_refresh(db: Session, interval_seconds: int = 60):
    """
    Periodically re-runs NLP pipelines AND Continuous Scraper.
    Background Task: "Continuous Intelligence"
    """
    print(f"⏰ [SCHEDULER] Service Started. Integrity Check Interval: {interval_seconds}s")
    scraper_engine = EliteScraperEngine() # Initialize once (browsers etc)

    while True:
        try:
            # 1. Continuous Scraping (High Priority)
            execute_continuous_extraction(db, scraper_engine)
            
            # 2. NLP Refresh (Lower Priority - run less often logic could be added)
            # print("[SCHEDULER] 🔹 Re-calibrating Sentiment...")
            # analyze_aspect_sentiment(db, ["policy", "reform", "bill", "act"])

            # 3. Sentinel Risk Audit (Engine 2.0 Phase 3)
            # Verify if it's nightly time or periodic check
            from app.services.sentinel_agent import SentinelAgent
            sentinel = SentinelAgent(db)
            # Run audit every loop? No, that's too heavy. Maybe once every 6 hours?
            # For demo immediate effect, we just print a check log
            # sentinel.run_nightly_audit()

            # Clean session to avoid leaks in long running loop
            db.expire_all()

        except Exception as e:
            print(f"[SCHEDULER ERROR] ❌ {str(e)}")
            db.rollback()

        time.sleep(interval_seconds)
