from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List, Optional
import shutil
import os
import glob
import time
import random
import requests
from app.db.database import get_db, DB_PATH
from app.core.security_deps import verify_admin
from app.models.user import User
from app.models.scheme import Scheme
from app.services.ai_service import oracle
from app.services.event_bus import bus
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text

class PolicyDraft(BaseModel):
    text: str

class BotQuery(BaseModel):
    query: str
    context: Optional[str] = None

router = APIRouter(prefix="/system", tags=["System Management"])

@router.get("/stats")
async def get_system_stats(db: Session = Depends(get_db)):
    try:
        user_count = db.query(User).filter(User.role == "citizen").count()
        active_schemes = db.query(Scheme).filter(Scheme.status == "Active").count()
        avg_score = db.execute(text("SELECT AVG(sentiment_score) FROM speeches")).scalar()
        avg_sentiment = f"{int(avg_score * 100)}%" if avg_score else "0%"
        critical_issues = db.execute(text("SELECT COUNT(*) FROM speeches WHERE sentiment_score < 0.3")).scalar() or 0
        return {"totalCitizens": user_count, "activeSchemes": active_schemes, "avgSentiment": avg_sentiment, "criticalIssues": critical_issues}
    except:
        return {"totalCitizens": 0, "activeSchemes": 0, "avgSentiment": "0%", "criticalIssues": 0}

@router.post("/bot/ask")
def ask_oracle(request: BotQuery):
    # LOCAL INTELLIGENCE LAYER (Fail-safe)
    q = request.query.lower()
    local_kb = {
        "hi": "Greetings, Citizen. How can I assist you with the Constitution of India today?",
        "article 14": "Article 14 guarantees 'Equality before Law'.",
        "article 21": "Article 21 protects 'Life and Personal Liberty'.",
        "article 23": "Article 23 prohibits 'Traffic in human beings and forced labour'. It protects against exploitation.",
        "article 24": "Article 24 prohibits employment of children (below 14 years) in factories and hazardous jobs.",
        "article 36": "Article 36 defines 'The State' for Directive Principles.",
        "article 44": "Article 44 directs the State to secure a Uniform Civil Code."
    }
    for key in local_kb:
        if key in q: return {"answer": local_kb[key]}

    # POWERFUL v1beta API CONNECTION (Unfiltered)
    import os, requests
    api_key = os.getenv("GEMINI_API_KEY", "***REMOVED***")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}"
    
    payload = {
        "contents": [{
            "parts": [{"text": f"SYSTEM: You are an elite Constitutional Expert. Use this text: {request.context}. ANSWER: {request.query}"}]
        }],
        "safetySettings": [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"}
        ],
        "generationConfig": {
            "temperature": 1.0,
            "maxOutputTokens": 2048,
        }
    }
    
    try:
        response = requests.post(url, json=payload, timeout=20)
        res_data = response.json()
        if 'candidates' in res_data:
            return {"answer": res_data['candidates'][0]['content']['parts'][0]['text']}
        
        # Log failure reason for the user
        error_msg = res_data.get('error', {}).get('message', 'Blocked by Safety Filters')
        return {"answer": f"AI Sync Error: {error_msg}. Please refer to the Constitution Reader on the left."}
    except Exception as e:
        return {"answer": f"Connection Error. Please check your internet or API key. Error: {str(e)}"}

@router.get("/geo-risk")
def get_geo_risk(db: Session = Depends(get_db)):
    from sqlalchemy import func
    rows = db.query(User.region, func.count(User.id)).group_by(User.region).all()
    region_data = {"North": 0, "South": 0, "East": 0, "West": 0, "Central": 0}
    for region, count in rows:
        if region in region_data: region_data[region] = count
    total = sum(region_data.values()) or 1
    zones = []
    for name, count in region_data.items():
        share = count / total
        status = "Stable" if share > 0.2 else "Watch" if share > 0.1 else "Critical"
        zones.append({"name": name, "status": status, "sentiment": 0.5 + (share * 0.5), "alerts": int(5 * (1 - share))})
    return zones

@router.post("/oracle")
def oracle_chat(query: str):
    return oracle.query(query)
