from apscheduler.schedulers.background import BackgroundScheduler
from app.services.scraper_service import scrape_latest_debates
# Assuming we have a service to fetch schemes/policies too
import time

def ingest_daily_update():
    print("[SCHEDULER] Checking for new parliamentary data...")
    # 1. Scrape latest debates
    scrape_latest_debates()
    # 2. Check for new notifications (Simulated or Real RSS)
    print("[SCHEDULER] Daily update complete.")

def start_scheduler():
    scheduler = BackgroundScheduler()
    # Run every 24 hours
    scheduler.add_job(ingest_daily_update, 'interval', hours=24)
    scheduler.start()
    print("[SYSTEM] System Scheduler Started: Auto-ingestion active.")
