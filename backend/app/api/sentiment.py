from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.sentiment_model import analyze_aspect_sentiment
from app.utils.explainability import explain_sentiment
from app.services.predictive_service import forecast_sentiment_trend
from app.services.nlp_client import get_nlp_client
from typing import List, Dict, Any

router = APIRouter(prefix="/sentiment", tags=["Sentiment Analysis"])

@router.get("/aspect")
def aspect_sentiment(
    aspect: List[str] = Query(..., description="List of keywords, e.g. 'healthcare', 'hospitals'"),
    db: Session = Depends(get_db)
):
    """
    Analyzes sentiment only for speeches mentioning specific aspects.
    """
    return analyze_aspect_sentiment(db, aspect)

@router.get("/forecast")
def forecast_sentiment(
    topic: str = Query(..., description="Topic to predict sentiment for"),
    days: int = Query(30, description="Days to forecast"),
    db: Session = Depends(get_db)
):
    """
    Predict future sentiment trends based on historical debate data.
    """
    return forecast_sentiment_trend(db, topic, days)


@router.post("/analyze", response_model=dict)
async def analyze_sentiment_via_nlp(
    payload: Dict[str, str] = Body(..., example={"text": "Citizens praised the new policy."}),
):
    """Analyze free text using the NLP backend with graceful fallback."""
    text = (payload or {}).get("text", "")
    if not text:
        return {"status": "error", "message": "text is required"}

    nlp = get_nlp_client()
    result: Dict[str, Any] = await nlp.analyze_sentiment(text)
    return {"status": "ok", "result": result}
