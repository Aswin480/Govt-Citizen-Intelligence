from sqlalchemy import Column, Integer, String, Text
from app.db.base import Base

class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False) # Stores the summary/impact text
    
    # Logic Fields (Comma separated string for simple matching)
    affected_states = Column(String, nullable=True)  # e.g. "Kerala,Tamil Nadu" or "All"
    target_groups = Column(String, nullable=True)    # e.g. "Student,Farmer"
    
    status = Column(String, default="Active")
