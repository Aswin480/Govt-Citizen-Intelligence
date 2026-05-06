from app.core.celery_app import celery_app
from app.services.news_scraper import scrape_and_ingest

@celery_app.task(name="app.workers.news_worker.scheduled_news_scrape")
def scheduled_news_scrape():
    """
    Automated Background Task:
    Wakes up every 4 hours to fetch breaking news, process it using the AI Sentinel model,
    and save the results directly to the PostgreSQL database for the frontend to consume.
    """
    print("⏳ [CELERY] Starting scheduled news intelligence scrape...")
    result = scrape_and_ingest()
    print(f"✅ [CELERY] Scraping finished with result: {result}")
    return result
