# Lok Sabha Pipeline (Clean)

**Overview**
This repo contains an end-to-end pipeline that scrapes Lok Sabha debate PDFs, extracts and cleans speeches, translates Hindi to English, scores MPs across core values, and stores results in SQLite. It also ships with a lightweight Django API for querying MP scores and evidence, plus a daily background ingestion loop to keep the dataset fresh.

**What You Get**
- Batch pipeline for scraping, extraction, translation, scoring, and export
- SQLite database with batch metadata, speeches, scores, and evidence
- Django API for querying MPs, scores, evidence, and health
- Daily ingestion scheduler that detects new debate files and processes them in batches of 10

**Project Structure**
- `pipeline.py` main pipeline script
- `data/raw/lok_sabha_debates_uncorrected.csv` input index of debate pages
- `models/parliament_roberta_regression.pt` trained regression model
- `outputs/pipeline.sqlite3` main database
- `outputs/batches/` per-batch artifacts
- `server/` Django API and ingestion scheduler

**Requirements**
- Python 3.9+
- `pip install -r requirements.txt`

**Quick Start (Pipeline)**
```bash
python pipeline.py all --start 1 --end 10
```

**Incremental Batches (Recommended)**
```bash
python pipeline.py auto --batch-size 10
```
This mode resumes safely, stores run state in `outputs/run_state.json`, and only processes new items.

**Step-by-Step Pipeline Commands**
```bash
python pipeline.py scrape-mps
python pipeline.py download-pdfs --start 1 --end 10
python pipeline.py extract-speeches
python pipeline.py merge-speeches
python pipeline.py translate-clean
python pipeline.py remove-hindi
python pipeline.py score
```

**Inputs**
- `data/raw/lok_sabha_debates_uncorrected.csv` must exist
- `models/parliament_roberta_regression.pt` must exist
- `data/raw/lok_sabha_mps.txt` is optional and auto-generated if missing

**Outputs**
- `data/interim/Lok_Sabha_Debates_Final.pdf`
- `data/interim/lok_sabha_aggressive_full.csv`
- `data/interim/lok_sabha_merged.csv`
- `data/interim/lok_sabha_merged_translated.csv`
- `data/processed/lok_sabha_final_no_hindi.csv`
- `outputs/batches/<batch_id>/scores.json`
- `outputs/batches/<batch_id>/evidence.json`
- `outputs/pipeline.sqlite3`

**Database (SQLite)**
Path: `outputs/pipeline.sqlite3`

Tables:
- `batches` batch metadata
- `speeches` cleaned speeches per batch
- `scores` aggregated MP scores per core value
- `score_evidence` per-speech evidence tied to scores

**Django API**
Install and run:
```bash
pip install -r requirements.txt
python server/manage.py runserver
```

Endpoints:
- `GET /health/`
- `GET /api/core-values/`
- `GET /api/batches/?limit=50&offset=0`
- `GET /api/mps/?q=shashi&limit=100&offset=0`
- `GET /api/mps/<mp_name>/scores/?batch=latest|all|<batch_id>&core_value=Education`
- `GET /api/mps/<mp_name>/evidence/?batch=latest|all|<batch_id>&core_value=Education&limit=100&offset=0`
- `GET /api/mps/<mp_name>/core/<core_value>/?batch=latest|all|<batch_id>&limit=50&offset=0`
- `GET /api/ingest/status/`

Notes:
- `mp_name` is case-insensitive and must be URL-encoded for spaces
- `batch=latest` is the default when omitted

**Daily Ingestion Scheduler**
When Django starts, a background thread runs once per day to:
1. Scan for new debate handles on the source website
2. Update `data/raw/lok_sabha_debates_uncorrected.csv`
3. Process new items in batches of 10

Manual run:
```bash
python server/manage.py ingest_once
```

**Configuration (Environment Variables)**
- `DJANGO_DEBUG=1` enable debug mode
- `DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1`
- `DJANGO_SECRET_KEY=...`
- `DJANGO_TIME_ZONE=UTC`

- `PIPELINE_DB=/path/to/pipeline.sqlite3`
- `PIPELINE_INDEX_CSV=/path/to/lok_sabha_debates_uncorrected.csv`
- `PIPELINE_BATCH_SIZE=10`
- `PIPELINE_PAGES_TO_REMOVE=13`
- `PIPELINE_SCORE_THRESHOLD=1.6`
- `PIPELINE_USE_GPU=0`

- `INGEST_ENABLE=1` set to 0 to disable auto-ingestion
- `INGEST_INTERVAL_SECONDS=86400`
- `INGEST_MAX_SCAN_AHEAD=50`
- `INGEST_MAX_CONSECUTIVE_MISSES=20`
- `INGEST_HANDLE_PREFIX=https://eparlib.sansad.in/handle/123456789`
- `INGEST_STATUS_FILE=outputs/ingest_status.json`

**Troubleshooting**
- Missing model file: ensure `models/parliament_roberta_regression.pt` exists
- Translation requires internet access via Google Translate (deep-translator)
- PDF downloads require access to the source website
- If merges fail with "Not enough pages to remove", lower `PIPELINE_PAGES_TO_REMOVE`

**Notes**
- Large batches can be slow without GPU acceleration
- For production deployments, consider disabling auto-ingestion in the web server and running `ingest_once` in a separate scheduled process
