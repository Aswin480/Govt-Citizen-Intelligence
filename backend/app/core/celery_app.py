from celery import Celery
from celery.schedules import crontab
from app.config import settings

celery_app = Celery(
    "gov_intelligence_worker",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=[
        "app.workers.scraper_worker",
        "app.workers.news_worker"
    ]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=False,
    task_routes={
        "app.workers.scraper_worker.scrape_url": "scrape_queue",
        "app.workers.scraper_worker.process_pdf": "scrape_queue",
        "app.workers.news_worker.scheduled_news_scrape": "scrape_queue"
    },
)

# Automated Schedule for the Intelligence Pipeline
celery_app.conf.beat_schedule = {
    "scrape-breaking-news-every-4-hours": {
        "task": "app.workers.news_worker.scheduled_news_scrape",
        "schedule": crontab(minute=0, hour='*/4'),  # Every 4 hours
    },
}

if __name__ == "__main__":
    celery_app.start()
