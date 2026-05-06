from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Float, JSON
from sqlalchemy.sql import func
from app.db.base import Base

class ScraperJob(Base):
    """
    Persistent model for tracking continuous scraping tasks.
    """
    __tablename__ = "scraper_jobs"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=True) # User friendly name "Lok Sabha Updates"
    
    # Configuration
    frequency_seconds = Column(Integer, default=300) # How often to check
    schema_prompt = Column(String, nullable=True) # AI Instructions
    force_ai = Column(Boolean, default=False)
    
    # State & Health Diagnostics (The "Dashboard")
    is_active = Column(Boolean, default=True)
    last_run_at = Column(DateTime, nullable=True)
    last_status = Column(String, nullable=True) # "success", "error", "healing"
    last_error = Column(Text, nullable=True)
    
    # Advanced Metrics (Elite Observability)
    health_score = Column(Float, default=100.0) # 0-100 Reliability Score
    consecutive_failures = Column(Integer, default=0) # For circuit breaker
    avg_latency_ms = Column(Integer, default=0) # Performance tracking

    # Self-Healing & Intelligence
    # { "main_table": "table.views-table", "date_field": "span.date" }
    selector_registry = Column(JSON, default={}) 
    
    # Change Detection
    last_data_hash = Column(String, nullable=True) # MD5 of datasets to detect changes
    total_datasets_found = Column(Integer, default=0)
    
    # Legal & Provenance (Audit Trail)
    # { "robots_txt_hash": "...", "terms_accepted": true, "source_tier": "official_gov" }
    provenance_meta = Column(JSON, default={})

    created_at = Column(DateTime(timezone=True), server_default=func.now())
