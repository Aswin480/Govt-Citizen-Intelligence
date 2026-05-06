from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.topic_modeling import run_topic_modeling

router = APIRouter(prefix="/topics", tags=["Topic Modeling"])

@router.get("/run")
def run_topics(db: Session = Depends(get_db)):
    try:
        return run_topic_modeling(db)
    except Exception as e:
        # In production, log this error
        print(f"Error during topic modeling: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
