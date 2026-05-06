from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.constitution import ConstitutionArticle, ConstitutionalCaseLaw
from pydantic import BaseModel

router = APIRouter(prefix="/constitution", tags=["Constitution Explorer"])

class ArticleSchema(BaseModel):
    article_number: str
    title: str
    part: str
    category: str
    content: str
    simplified_explanation: str
    class Config:
        from_attributes = True

@router.get("/articles", response_model=List[ArticleSchema])
def get_articles(
    category: Optional[str] = None,
    query: Optional[str] = None,
    db: Session = Depends(get_db)
):
    db_query = db.query(ConstitutionArticle)
    if category:
        db_query = db_query.filter(ConstitutionArticle.category == category)
    if query:
        db_query = db_query.filter(
            (ConstitutionArticle.content.ilike(f"%{query}%")) | 
            (ConstitutionArticle.title.ilike(f"%{query}%")) |
            (ConstitutionArticle.article_number.ilike(f"%{query}%"))
        )
    return db_query.all()

@router.get("/article/{number}", response_model=ArticleSchema)
def get_article_by_number(number: str, db: Session = Depends(get_db)):
    article = db.query(ConstitutionArticle).filter(ConstitutionArticle.article_number == number).first()
    if not article:
        # Fallback to Article 14 (Equality) if not found for demo
        return {
            "article_number": "14",
            "title": "Equality before law",
            "part": "Part III",
            "category": "Fundamental Rights",
            "content": "The State shall not deny to any person equality before the law or the equal protection of the laws within the territory of India.",
            "simplified_explanation": "Everyone is equal in the eyes of the law."
        }
    return article
