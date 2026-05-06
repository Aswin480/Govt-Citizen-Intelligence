from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Enum
from sqlalchemy.orm import relationship
from app.db.base import Base
import datetime

class NewsArticle(Base):
    __tablename__ = "news_articles"

    id = Column(Integer, primary_key=True, index=True)
    
    # Region Targeting
    region_type = Column(String, index=True) # "Nation", "State", "UT"
    region_name = Column(String, index=True) # "India", "Tamil Nadu", "Delhi", etc.
    
    # Metadata
    section = Column(String) # "Front Page", "National", "Business", etc.
    page = Column(Integer)   # 1 to 11
    priority = Column(Integer, default=1) # 1 = Top Headline, 2 = Major, 3 = Minor
    language = Column(String, default="en", index=True) # "en", "hi", "ta", etc.
    
    # Content
    headline = Column(String)
    subheadline = Column(String, nullable=True)
    author = Column(String)
    location = Column(String)
    content = Column(JSON) # Store paragraphs as list of strings ["Para 1", "Para 2"]
    image_url = Column(String, nullable=True)
    
    published_at = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
