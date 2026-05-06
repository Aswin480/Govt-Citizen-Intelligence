import os
print("DEBUG: Loading main.py...")
print(f"DEBUG: CWD = {os.getcwd()}")
print("Setting TF_USE_LEGACY_KERAS=1 for compatibility...")
os.environ["TF_USE_LEGACY_KERAS"] = "1"

from typing import Optional

from fastapi import FastAPI, APIRouter, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import or_
from sqlalchemy.orm import Session
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.config import settings
from app.db.database import engine, SessionLocal, get_db
from app.db.base import Base
from app.models.parliament import Member
from app.api import auth as auth_api
# Sentry Removed
# SENTRY_DSN = os.getenv("SENTRY_DSN")


# Import all models so SQLAlchemy knows about them (Registry)
print("DEBUG: Importing models...")
from app.models import user, debate, policy, scheme, party, speaker, system, citizen, element_style, style_change_log, dynamic_component, budget, news, state
print("DEBUG: Models imported.")

# APIs
print("DEBUG: Importing APIs...")
from app.api import (
    parliament, sentiment, schemes, explain, posters, policies, sessions, 
    topics, budget, news, system, states, nexus_graph, health, ingest, extractor
)
print("DEBUG: APIs imported.")

from app.services.scheduler import start_scheduler

# Create the database tables
# Create the database tables
print("DEBUG: Creating database tables...")
try:
    Base.metadata.create_all(bind=engine)
    print("DEBUG: Database tables created.")
except Exception as e:
    print(f"WARNING: Database table creation failed. The app will run in LIMITED/DEMO mode. Error: {e}")

# Start Background Scheduler for Future Data (RSS/Live Updates)
# start_scheduler()

from startup_verification import verify_startup
import sys

app = FastAPI(
    title=settings.app_name,
    description="Backend API for parliamentary analysis.",
    version="1.0.0"
)

@app.on_event("startup")
async def startup_event():
    print("DEBUG: Running Startup Verification...")
    if not verify_startup():
        print("ERROR: Startup verification failed! Some features will be disabled.")
    else:
        print("SUCCESS: All startup checks passed.")

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["1000/minute"])

# @app.middleware("http")
# async def log_requests(request: Request, call_next):
#     print(f"DEBUG LOG: Request path={request.url.path} method={request.method}")
#     response = await call_next(request)
#     print(f"DEBUG LOG: Response status={response.status_code}")
#     return response

# Add rate limiting
# app.state.limiter = limiter
# app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"], # Explicitly allow frontend
    allow_origin_regex="https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a central API Router
api_router = APIRouter(prefix="/v1")

api_router.include_router(parliament.router)
api_router.include_router(sentiment.router)
api_router.include_router(topics.router)
api_router.include_router(schemes.router)
api_router.include_router(explain.router)
api_router.include_router(posters.router)
api_router.include_router(policies.router)
api_router.include_router(sessions.router)
api_router.include_router(auth_api.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(budget.router)
api_router.include_router(news.router)
api_router.include_router(system.router)
api_router.include_router(states.router)
api_router.include_router(nexus_graph.router)
api_router.include_router(health.router)
api_router.include_router(ingest.router)
api_router.include_router(extractor.router)

from app.api import system as system_api
from app.api import auth as auth_api
from app.api import news as news_api
from app.api import budget as budget_api

api_router.include_router(system_api.router)
api_router.include_router(auth_api.router, prefix="/auth")
api_router.include_router(news_api.router)
api_router.include_router(budget_api.router)
from app.api import health as health_api
api_router.include_router(health_api.router, prefix="/health", tags=["Health"])

from app.api import states
api_router.include_router(states.router, tags=["States"])

from app.routers import config
api_router.include_router(config.router, prefix="/config", tags=["System Config"])

from app.routers import visual_builder, page_builder
api_router.include_router(visual_builder.router)
api_router.include_router(page_builder.router)

from app.api import extractor
api_router.include_router(extractor.router, tags=["Extractor"])

# --- ENGINE 1.0: DATA ACQUISITION FABRIC ---
from app.api import ingest
api_router.include_router(ingest.router, prefix="/ingest", tags=["Engine 1.0: Data Acquisition"])



# --- ENGINE 2.0: NEXUS GRAPH ---
from app.api import nexus_graph
api_router.include_router(nexus_graph.router, tags=["Engine 2.0: Nexus Graph"])

from app.routers import intel
api_router.include_router(intel.router, tags=["Intelligence"])

# Include the main router app
app.include_router(api_router)

# Legacy compatibility endpoints (to support /api/* from older client config)
@app.get("/api/mps/")
def legacy_mps(q: Optional[str] = None, limit: int = 20, offset: int = 0, db: Session = Depends(get_db)):
    q = (q or "").strip()
    if limit < 1:
        raise HTTPException(status_code=400, detail="limit must be >= 1")
    if offset < 0:
        raise HTTPException(status_code=400, detail="offset must be >= 0")

    query = db.query(Member)
    if q:
        pattern = f"%{q}%"
        query = query.filter(
            or_(
                Member.name.ilike(pattern),
                Member.constituency.ilike(pattern),
                Member.party.ilike(pattern),
                Member.state_id.ilike(pattern),
            )
        )

    total = query.count()
    members = query.order_by(Member.name).offset(offset).limit(limit).all()

    return {
        "mps": [
            {
                "id": m.id,
                "name": m.name,
                "constituency": m.constituency,
                "state": m.state_id,
                "party": m.party,
                "house_id": m.house_id,
                "profile_image": m.profile_image,
            }
            for m in members
        ],
        "count": total,
        "limit": limit,
        "offset": offset,
    }


@app.get("/api/auth/me")
def legacy_auth_me(token: str = Depends(auth_api.oauth2_scheme), db: Session = Depends(get_db)):
    # Reuse auth logic from auth module to avoid duplication
    return auth_api.read_users_me(token=token, db=db)


# Mount static files for posters
# Ensure directory exists to avoid error on startup if it doesn't
os.makedirs("backend/generated_posters", exist_ok=True)

app.mount(
    "/backend/generated_posters",
    StaticFiles(directory="backend/generated_posters"),
    name="generated_posters",
)


print("DEBUG: Importing Sentiment Pipeline...")
from app.services.sentiment_model import get_sentiment_pipeline
print("DEBUG: Importing Summarizer Pipeline...")
from app.services.summarizer_service import get_summarizer_pipeline
import threading

# Import Auto-Ingest Service
print("DEBUG: Importing Auto-Ingest Service...")
from app.services.auto_ingest_service import watch_and_ingest
print("DEBUG: Importing Scheduler Service...")
from app.services.scheduler_service import scheduled_nlp_refresh
print("DEBUG: Services imported.")
# from app.services.scheduler_service import scheduled_nlp_refresh
# from app.db.database import SessionLocal # Imported at top

def start_auto_ingestion():
    db = SessionLocal()
    watch_and_ingest(db)

def start_data_refresh_scheduler():
    db = SessionLocal()
    scheduled_nlp_refresh(db)

# Start Background Thread for Auto-Ingestion
# Start Background Thread for Auto-Ingestion
# threading.Thread(
#     target=start_auto_ingestion,
#     daemon=True
# ).start()

# Start Background Thread for NLP Scheduler
# threading.Thread(
#     target=start_data_refresh_scheduler,
#     daemon=True
# ).start()

@app.post("/warmup", tags=["System"])
def warmup_models():
    """
    Mocked warmup. Models are disabled.
    """
    return {"status": "Warmup skipped", "message": "AI Models are disabled for performance."} 

@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "ok",
        "service": "backend",
        "environment": settings.env,
        "system": settings.app_name
    }
