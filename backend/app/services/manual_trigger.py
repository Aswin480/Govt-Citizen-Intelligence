import sys
import os
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(BASE_DIR)

from app.db.database import SessionLocal
from app.services.extractor_engine import EliteScraperEngine
from app.models.scraper_job import ScraperJob
import datetime

def force_run_all():
    db = SessionLocal()
    engine = EliteScraperEngine()
    
    print("🚀 Force Running All Elite Scraper Jobs...")
    jobs = db.query(ScraperJob).all()
    
    for job in jobs:
        print(f"  > Processing: {job.name} ({job.url})")
        try:
             # Force AI to be False for speed in this demo, unless necessary
             # But user wants "Best in World", so maybe stick to job config
             result = engine.run_dynamic({
                "url": job.url,
                "target_schema": job.schema_prompt,
                "force_ai": job.force_ai
            })
             
             if result['status'] == 'success':
                 print(f"    ✅ Success. Found {len(result['datasets'])} items.")
                 job.last_run_at = datetime.datetime.utcnow()
                 job.last_status = "success"
                 job.total_datasets_found = len(result['datasets'])
             else:
                 print(f"    ❌ Failed: {result.get('message')}")
                 job.last_status = "error"
                 
             db.commit()
             
        except Exception as e:
            print(f"    ⚠️ Exception: {e}")
            
    print("🏁 All jobs processed.")
    db.close()

if __name__ == "__main__":
    force_run_all()
