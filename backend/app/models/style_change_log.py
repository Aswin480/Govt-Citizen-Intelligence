from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from app.db.base import Base

class StyleChangeLog(Base):
    """Audit trail for all Visual Builder changes"""
    __tablename__ = "style_change_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    element_selector = Column(String, index=True)
    old_css_text = Column(Text, nullable=True)  # Previous styles (null for first save)
    new_css_text = Column(Text)  # New styles
    changed_by = Column(String, index=True)  # Admin username - INDEXED for fast filtering
    changed_at = Column(DateTime, default=datetime.utcnow, index=True)
    action = Column(String, index=True)  # "create", "update", "delete" - INDEXED for fast filtering
    description = Column(Text, nullable=True)  # Optional change description
