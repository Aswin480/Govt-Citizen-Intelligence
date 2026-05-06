from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class ConstitutionArticle(Base):
    __tablename__ = "constitution_articles"

    id = Column(Integer, primary_key=True, index=True)
    article_number = Column(String(20), unique=True, index=True)
    title = Column(String(255))
    part = Column(String(50))
    category = Column(String(100)) # e.g., Fundamental Rights, Directive Principles
    content = Column(Text)
    simplified_explanation = Column(Text)

class ConstitutionalCaseLaw(Base):
    __tablename__ = "constitution_case_law"

    id = Column(Integer, primary_key=True, index=True)
    case_name = Column(String(255))
    year = Column(Integer)
    article_id = Column(Integer, ForeignKey("constitution_articles.id"))
    verdict = Column(Text)
    significance = Column(Text)
