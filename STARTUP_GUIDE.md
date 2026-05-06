# Startup Guide

## The 1-Click Startup
To run the entire GovTech platform locally:
1. Double click `1_FULL_SYSTEM.bat`
2. It will boot up:
   - PostgreSQL (Database)
   - Redis & MinIO (via Docker, if available)
   - FastAPI Backend (http://localhost:8000)
   - React Frontend (http://localhost:5173)

## Manual Startup
If you want to run things manually:

**1. Backend:**
```bash
cd backend
..\.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

**2. Frontend:**
```bash
cd frontend-citizen
pnpm run dev
```
