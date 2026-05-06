from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# 1. Load Environment Variables
load_dotenv()

# 2. Get Database URL
# Default to SQLite if not set, matching the .env instruction
PRIMARY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./citizen_policy_v2.db")

# 3. Create the Database Engine
# "check_same_thread": False is needed only for SQLite. 
# "timeout": 30 increases wait time for locks (fixes startup contention)
primary_connect_args = {"check_same_thread": False, "timeout": 30} if "sqlite" in PRIMARY_DATABASE_URL else {}
DB_PATH = PRIMARY_DATABASE_URL.replace("sqlite:///", "").replace("./", "")

try:
    engine = create_engine(
        PRIMARY_DATABASE_URL, connect_args=primary_connect_args, pool_pre_ping=True, pool_recycle=3600
    )
    # Test connection to see if DB is available (e.g. Docker is running)
    with engine.connect() as conn:
        pass
    SQLALCHEMY_DATABASE_URL = PRIMARY_DATABASE_URL
    connect_args = primary_connect_args
except Exception as e:
    print(f"WARNING: Could not connect to primary database. Falling back to local SQLite demo mode. Error: {e}")
    SQLALCHEMY_DATABASE_URL = "sqlite:///./demo_fallback.db"
    connect_args = {"check_same_thread": False, "timeout": 30}
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args=connect_args, pool_pre_ping=True, pool_recycle=3600
    )

if "sqlite" in SQLALCHEMY_DATABASE_URL:
    from sqlalchemy import event
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.close()

# 4. Create SessionLocal
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 5. Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
