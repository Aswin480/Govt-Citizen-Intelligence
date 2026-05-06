# Govt Citizen Intelligence — Professional README

## Overview

Govt Citizen Intelligence is an integrated platform that makes government data, parliamentary debates, schemes, budgets, and member profiles accessible and actionable for citizens, journalists, and researchers. It combines a FastAPI backend, a React/Vite frontend (`frontend-citizen`), and an NLP service for debate analysis (`backend_nlp`). Large ML models and runtime artifacts are intentionally excluded from this repository; see "Machine Learning Models" below.

## Key Features

- Intelligent search and policy matching
- Parliamentary debate analysis and summarization
- Member profile pages and performance signals
- Scheme & budget explorers
- Configurable ingestion pipelines and scrapers
- Docker-ready for containerized deployments

## Repository Layout

- `backend/` — FastAPI application, DB migrations and backend scripts
- `backend_nlp/` — NLP pipelines, model outputs and processing code (models excluded)
- `frontend-citizen/` — React + Vite frontend application
- `app/` — supporting utilities and small demo server
- `data/` — curated datasets used for ingestion and tests
- `docs/` — architecture diagrams and onboarding docs
- `.gitignore` — important ignores (models, .venv, node_modules)

See the full tree in the repository root for additional helper scripts and tooling.

## Architecture (High Level)

The system consists of three main tiers:

- Frontend: `frontend-citizen` (React + Vite) communicates with the backend APIs.
- Backend API: `backend` (FastAPI) implements REST endpoints, DB access, and background workers.
- NLP Service: `backend_nlp` performs heavy NLP processing (speech parsing, embeddings, models).

Inter-service communication is via REST and message queues when configured (Celery/RabbitMQ). Static files and large assets are best served from object storage (S3, GCS) in production.

## Quick Start — Development (Local)

Prerequisites:

- Python 3.10+
- Node.js 18+ and `pnpm` (preferred)
- PostgreSQL (recommended) or SQLite for quick dev
- Git

1. Clone the repo (already done):

```bash
git clone https://github.com/Aswin480/Govt-Citizen-Intelligence.git
cd Govt-Citizen-Intelligence
```

2. Backend (FastAPI)

```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # edit environment variables
# Run migrations (if using Alembic/Postgres) or create sqlite for quick dev
python create_db.py               # or see backend/README.md
uvicorn app.main:app --reload --port 8000
```

3. Frontend (React / Vite)

```bash
cd frontend-citizen
pnpm install
pnpm run dev
```

4. NLP service (local / optional)

The NLP service is heavy and requires model artifacts. By default, the repository does NOT include trained model files. See the `Machine Learning Models` section below for instructions to fetch models.

## Environment variables

- Copy `backend/.env.example` to `backend/.env` and fill values (database URL, secret keys, S3 credentials for attachments, etc.).
- Copy `frontend-citizen/.env.example` if present and configure the API URL.

## Machine Learning Models (Important)

Large model files and caches were intentionally removed from the Git history to keep the repository lightweight. Recommended handling:

- Store model checkpoints and large artifacts in object storage (S3, GCS, or private storage).
- Use Git LFS only for moderately large binaries; for multi-hundred-megabyte models prefer external storage and download scripts.

Example helper script to download models from an S3 bucket (create `scripts/download_models.sh`):

```bash
#!/usr/bin/env bash
set -e
# Example: AWS S3
aws s3 cp s3://your-bucket/models/parliament_roberta_regression.pt backend_nlp/models/parliament_roberta_regression.pt
aws s3 sync s3://your-bucket/backend_nlp/outputs backend_nlp/outputs
```

Windows PowerShell example:

```powershell
aws s3 cp s3://your-bucket/models/parliament_roberta_regression.pt backend_nlp/models/parliament_roberta_regression.pt
```

Add a short note in `README.md` or `backend_nlp/README.md` documenting credentials and expected paths. If you want, I can add a small `download_models.py` script that reads target URLs from a YAML/JSON manifest.

## Cleaning up / Git LFS recommendations

- If you ever need to store model artifacts under version control, follow Git LFS:

```bash
# Install Git LFS then:
git lfs install
git lfs track "*.pt"
git add .gitattributes
```

Note: Git LFS still stores large files; object storage is usually better for ML models.

## Running tests

- Backend tests (pytest):

```bash
cd backend
pytest -q
```

- Frontend basic checks:

```bash
cd frontend-citizen
pnpm run build      # catches TypeScript errors
pnpm run test       # if test scripts exist
```

## Docker / Deployment

- A `docker-compose.yml` is included for local integration. To run the main services:

```bash
docker-compose up --build
```

- For production, build containers and deploy via your preferred orchestrator (ECS, GKE, Kubernetes, or a VM). Externalize secrets via environment variables or secret managers.

## Security & Secrets

- Do NOT commit `.env` files or secret keys. Use `.env.example` in the repo to document required variables.
- Ensure database URLs, API keys, and S3 credentials are injected at runtime via CI/CD or secret managers.

## Contributing

- Fork the repo and open a PR against `main`.
- Run tests locally and keep changes scoped to a feature/bugfix.
- If adding large assets, prefer external storage and include scripts that fetch them during CI.

## Troubleshooting

- Push failures due to repository size: large binaries should be removed from history (we removed `backend_nlp/models/` from history already).
- If you see authentication errors pushing to `origin`, ensure your Git credentials or PAT are configured.

## Contact & Support

If you need help with deployment, storing or serving models, or adding CI steps, open an issue or contact the maintainer listed in the repository settings.

---

_This README was generated to be clear for developers and operators — if you'd like a trimmed "quickstart" one-page or a user-facing README (for non-technical audiences), I can add that as well._
