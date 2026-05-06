from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from app.core.config import settings

# Ensure storage directory exists
os.makedirs(settings.STORAGE_DIR, exist_ok=True)

SQLITE_URL = f"sqlite:///{os.path.join(settings.STORAGE_DIR, 'engine.db')}"

engine = create_engine(
    SQLITE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
