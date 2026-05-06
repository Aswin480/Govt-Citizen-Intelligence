from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    
    
    # Auth Fields
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="citizen") # "citizen", "admin", "analyst"
    is_active = Column(Integer, default=1) # 1=Active, 0=Inactive
    
    # Link to Citizen Profile (if role="citizen")
    citizen_id = Column(String, index=True, nullable=True)

    # Phase 6: Real Geospatial Data
    region = Column(String, default="North") # North, South, East, West, Central
    
    # Demographic Data (For Policy Matching)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True) # Male, Female, Other
    profile_pic = Column(String, nullable=True) # URL or Base64 (simplified)
    age_group = Column(String, index=True, nullable=True)
    occupation = Column(String, index=True, nullable=True)
    state = Column(String, index=True, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
