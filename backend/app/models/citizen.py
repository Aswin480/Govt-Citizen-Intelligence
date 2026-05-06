from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.db.base import Base

class Citizen(Base):
    __tablename__ = "citizens"

    id = Column(Integer, primary_key=True, index=True)
    citizen_id = Column(String, unique=True, index=True) # E.g., CIT-2024-001
    full_name = Column(String)
    region = Column(String) 
    occupation = Column(String)
    status = Column(String, default="Active") # Active, Pending, Inactive
    is_verified = Column(Boolean, default=False)
    registered_at = Column(DateTime(timezone=True), server_default=func.now())
