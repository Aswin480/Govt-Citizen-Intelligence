from fastapi import FastAPI
from app.core import config
from app.api import endpoints
from app.db.database import Base, engine

# Create Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Document Intelligence Engine", version="0.1.0")

app.include_router(endpoints.router, prefix=config.settings.API_V1_STR)

@app.get("/")
def read_root():
    return {"message": "AI Document Intelligence Engine is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
