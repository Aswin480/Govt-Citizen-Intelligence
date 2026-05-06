from sqlalchemy import Column, Integer, String, Text, JSON, DateTime
from datetime import datetime
from app.db.base import Base

class DynamicComponent(Base):
    """Stores user-added components like buttons, boxes, and alerts"""
    __tablename__ = "dynamic_components"
    
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, index=True)  # 'button', 'card', 'alert', 'container'
    content = Column(Text)             # Inner text or HTML
    props = Column(JSON, default={})   # Component properties (variant, icon, href)
    style = Column(JSON, default={})   # Custom CSS styles
    parent_id = Column(String, index=True) # CSS selector of container (e.g. "#main-feed")
    order = Column(Integer, default=0) # Display order
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String)        # Admin who created it
