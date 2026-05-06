from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from app.db.base import Base

class ElementStyle(Base):
    """Stores custom styles applied via Visual Builder"""
    __tablename__ = "element_styles"
    
    id = Column(Integer, primary_key=True, index=True)
    element_selector = Column(String, unique=True, index=True)  # CSS selector like "#header" or ".button-primary"
    css_text = Column(Text)  # The actual CSS styles
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String)  # Admin username who created it
