from datetime import datetime
import hashlib
import requests
import redis
from app.core.celery_app import celery_app
from app.config import settings
from app.services.minio_client import minio_client
from app.schemas.integration_events import ScrapeResult, ContentReference

# Connect to Redis for Engine 2.0 Handoff (Stream)
redis_client = redis.Redis.from_url(settings.redis_url)

@celery_app.task(name="app.workers.scraper_worker.scrape_url", bind=True, max_retries=3)
def scrape_url(self, job_id: str, url: str, metadata: dict = None):
    """
    Engine 1.0 Worker:
    1. Fetch URL (HTML/PDF)
    2. Upload Raw -> MinIO
    3. Publish Result -> Redis Stream (scrape:results) for Engine 2.0
    """
    print(f"Starting scrape job: {job_id} for URL: {url}")
    
    try:
        # 1. Fetch
        response = requests.get(url, timeout=10, headers={"User-Agent": "CivicSentinel-Bot/1.0"})
        response.raise_for_status()
        
        content_type = response.headers.get("Content-Type", "").split(";")[0]
        timestamp = datetime.utcnow().isoformat()
        
        # 2. Store in MinIO
        # Create a unique object key: report_custom-slug_timestamp.ext
        url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
        ext = "pdf" if "pdf" in content_type else "html"
        bucket = "raw-pdfs" if ext == "pdf" else "raw-html"
        object_key = f"{timestamp}_{url_hash}.{ext}"
        
        upload_meta = minio_client.upload_bytes(
            bucket=bucket,
            object_name=object_key,
            data=response.content,
            content_type=content_type
        )
        
        if not upload_meta:
            raise Exception("MinIO Upload Failed")

        # 3. Create Result Object
        result = ScrapeResult(
            job_id=job_id,
            success=True,
            status_code=response.status_code,
            processing_time_ms=int(response.elapsed.total_seconds() * 1000),
            content_ref=ContentReference(
                storage_bucket=bucket,
                object_key=object_key,
                content_type=content_type,
                size_bytes=len(response.content),
                etag=upload_meta["etag"]
            ),
            raw_text_snippet=response.text[:200] if ext == "html" else "[PDF Content]",
            timestamp=datetime.utcnow()
        )
        
        # 4. Handoff to Engine 2.0 (Redis Stream)
        # Using XADD to append to 'scrape:results'
        redis_client.xadd(
            "scrape:results",
            {"data": result.model_dump_json()}
        )
        
        return result.model_dump()

    except Exception as e:
        print(f"Scrape Failed: {e}")
        # Publish failure event too, so Engine 2.0 knows to skip/alert
        failure_result = ScrapeResult(
            job_id=job_id,
            success=False,
            status_code=0,
            error_message=str(e),
            processing_time_ms=0
        )
        redis_client.xadd("scrape:results", {"data": failure_result.model_dump_json()})
        
        # Retry logic
        try:
            self.retry(exc=e, countdown=60)
        except redis.exceptions.MaxRetriesExceededError:
            print("Max retries exceeded.")
