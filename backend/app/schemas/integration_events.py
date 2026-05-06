from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

# --- Event 1: New Scrape Job (Produced by API / Scheduler) ---
class ScrapeJob(BaseModel):
    job_id: str
    target_url: str
    source_type: str = "html"  # html, pdf, image
    priority: int = 1  # 1 (low) to 10 (critical)
    metadata: Dict[str, Any] = {}
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# --- Event 2: Scrape Result (Produced by Worker -> Engine 2.0) ---
class ContentReference(BaseModel):
    storage_bucket: str
    object_key: str
    content_type: str
    size_bytes: int
    etag: str

class ScrapeResult(BaseModel):
    job_id: str
    success: bool
    status_code: int
    content_ref: Optional[ContentReference] = None  # Pointer to MinIO
    raw_text_snippet: Optional[str] = None  # First 500 chars for quick debug
    error_message: Optional[str] = None
    processing_time_ms: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    # Engine 2.0 Handoff Metadata
    keywords_detected: List[str] = []
    language: str = "en"

# --- Event 3: AI Analysis Job (Engine 2.0 Input) ---
class AIAnalysisJob(BaseModel):
    job_id: str
    content_ref: ContentReference
    tasks: List[str] = ["entity_extraction", "summarization", "sentiment"]
