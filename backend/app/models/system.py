from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime

from app.db.base import Base


class SystemHealth(Base):
    __tablename__ = "system_health"

    id = Column(Integer, primary_key=True, index=True)
    service_name = Column(String, nullable=False)
    status = Column(String, nullable=False)
    checked_at = Column(DateTime, default=datetime.utcnow)


class SystemConfig(Base):
    __tablename__ = "system_config"

    key = Column(String, primary_key=True, index=True)  # e.g., 'primary_color', 'current_session_name'
    value = Column(String, nullable=False)              # e.g., '#FF9933', 'Budget Session'
    description = Column(String, nullable=True)         # Admin friendly label
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
