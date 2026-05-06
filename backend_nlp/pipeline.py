#!/usr/bin/env python3
"""
End-to-end pipeline for Lok Sabha debate scraping, cleaning, translation.

Pipeline Idea (High Level)
1) Discover debate sources from the index CSV (each row is a debate/day).
2) Download PDFs for selected rows and merge them into a single PDF.
3) Extract raw speeches from the merged PDF.
4) Merge consecutive speeches by the same speaker.
5) Translate and normalize speaker names; clean the speech text.
6) Remove any remaining Hindi text (optional quality filter).
7) Score speeches using a regression model and store evidence.
8) Orchestrate everything in batches (default size 10), persisting run state
   so crashes or interruptions resume safely without reprocessing completed work.
9) Export datasets (CSV + JSON) and store results in SQLite for scalable querying.
10) Clean up residue files after each batch to keep storage small and tidy.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
import shutil
import sqlite3
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple


def _configure_windows_hdd_caches() -> None:
    """Default heavy ML cache directories to HDD on Windows."""
    if os.name != "nt":
        return

    hdd_root = Path(os.getenv("PIPELINE_HDD_ROOT", r"D:\Development"))
    if not hdd_root.exists():
        return

    os.environ.setdefault("HF_HOME", str(hdd_root / ".hf"))
    os.environ.setdefault(
        "TRANSFORMERS_CACHE", str(Path(os.environ["HF_HOME"]) / "transformers")
    )
    os.environ.setdefault(
        "HF_DATASETS_CACHE", str(Path(os.environ["HF_HOME"]) / "datasets")
    )
    os.environ.setdefault("TORCH_HOME", str(hdd_root / ".torch"))
    os.environ.setdefault("PIP_CACHE_DIR", str(hdd_root / ".pip-cache"))
    os.environ.setdefault("XDG_CACHE_HOME", str(hdd_root / ".cache"))

    tmp_dir = str(hdd_root / "tmp")
    if os.getenv("PIPELINE_FORCE_HDD_TMP", "1") == "1":
        os.environ["TMP"] = tmp_dir
        os.environ["TEMP"] = tmp_dir
    else:
        os.environ.setdefault("TMP", tmp_dir)
        os.environ.setdefault("TEMP", tmp_dir)

    for env_key in [
        "HF_HOME",
        "TRANSFORMERS_CACHE",
        "HF_DATASETS_CACHE",
        "TORCH_HOME",
        "PIP_CACHE_DIR",
        "XDG_CACHE_HOME",
        "TMP",
        "TEMP",
    ]:
        Path(os.environ[env_key]).mkdir(parents=True, exist_ok=True)


_configure_windows_hdd_caches()


DEFAULT_CSV_FIELD_LIMIT = 16 * 1024 * 1024
_CSV_LIMIT_CONFIGURED = False


def _configure_csv_field_limit() -> None:
    """Increase CSV field size limit for large speech fields with a safe bound."""
    global _CSV_LIMIT_CONFIGURED

    if _CSV_LIMIT_CONFIGURED:
        return

    target_limit_raw = os.getenv("PIPELINE_CSV_FIELD_LIMIT", str(DEFAULT_CSV_FIELD_LIMIT))
    try:
        max_size = max(131072, int(target_limit_raw))
    except ValueError:
        max_size = DEFAULT_CSV_FIELD_LIMIT

    max_size = min(max_size, sys.maxsize)
    while True:
        try:
            csv.field_size_limit(max_size)
            _CSV_LIMIT_CONFIGURED = True
            return
        except OverflowError:
            max_size = max_size // 10


def _csv_dict_reader(file_obj: object) -> csv.DictReader:
    """Create a DictReader with a large-field parser limit configured."""
    _configure_csv_field_limit()
    return csv.DictReader(file_obj)

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
INTERIM_DIR = DATA_DIR / "interim"
PROCESSED_DIR = DATA_DIR / "processed"
OUTPUT_DIR = BASE_DIR / "outputs"
MODEL_DIR = BASE_DIR / "models"

MP_LIST_FILE = RAW_DIR / "lok_sabha_mps.txt"
DEBATE_INDEX_CSV = RAW_DIR / "lok_sabha_debates_uncorrected.csv"
DOWNLOAD_DIR = RAW_DIR / "downloaded_pdfs"
MERGED_PDF = INTERIM_DIR / "Lok_Sabha_Debates_Final.pdf"
AGGRESSIVE_CSV = INTERIM_DIR / "lok_sabha_aggressive_full.csv"
MERGED_CSV = INTERIM_DIR / "lok_sabha_merged.csv"
TRANSLATED_CSV = INTERIM_DIR / "lok_sabha_merged_translated.csv"
TRANSLATION_CACHE = OUTPUT_DIR / "translation_cache.json"
FINAL_CSV = PROCESSED_DIR / "lok_sabha_final_no_hindi.csv"
MODEL_PATH = MODEL_DIR / "parliament_roberta_regression.pt"
CHECKPOINT_FILE = OUTPUT_DIR / "progress_checkpoint.json"
SCORES_FILE = OUTPUT_DIR / "mp_reputation_scores.json"
EVIDENCE_FILE = OUTPUT_DIR / "mp_score_evidence.json"
RUN_STATE_FILE = OUTPUT_DIR / "run_state.json"
DB_FILE = OUTPUT_DIR / "pipeline.sqlite3"
BATCH_OUTPUT_DIR = OUTPUT_DIR / "batches"
DEFAULT_BATCH_SIZE = 10
MAX_NO_PDF_RETRIES = 3

DEFAULT_MPS_URL = "https://en.wikipedia.org/wiki/List_of_members_of_the_18th_Lok_Sabha"
DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}

SPEAKER_RE = re.compile(
    r"^(?:"
    r"(?:SHRI|SMT|Smt|Dr|DR|Prof|PROF|ADV)\.?\s+[A-Z .]{2,80}(?:\([A-Z ]+\))?|"
    r"(?:श्री|श्रीमती|डॉ|प्रो)\.?\s+[^:ः]{2,80}|"
    r"माननीय अध्यक्ष|माननीय सभापति|Hon\.?\s+Speaker|Hon\.?\s+Chair"
    r")\s*[ः:]\s*",
    re.UNICODE,
)

HEADER_RE = re.compile(
    r"^\d{2}-\d{2}-\d{4}.*Uncorrected\s*/\s*Not\s*for\s*publication",
    re.IGNORECASE,
)

NOISE_RE = re.compile(
    r"^\(?\d+\/[A-Z]+\/[A-Z]+\)?$|" r"^\(Q\.\d+\)$|" r"^\(ends?\)$",
    re.IGNORECASE,
)

HINDI_REGEX = re.compile("[\u0900-\u097f]")


class NoPdfsDownloadedError(RuntimeError):
    """Raised when a batch has no downloadable PDFs in the source set."""

LABELS = [
    "Education",
    "Women & Gender",
    "Economy & Jobs",
    "Health",
    "Environment & Pollution",
    "Agriculture & Farmers",
    "National Security & Military",
    "Social Justice & Welfare",
    "Infrastructure & Development",
    "Governance & Law",
    "NONE",
]


def ensure_dirs() -> None:
    """Create all required directories for raw, interim, processed, and output data."""
    for d in [
        RAW_DIR,
        INTERIM_DIR,
        PROCESSED_DIR,
        OUTPUT_DIR,
        MODEL_DIR,
        DOWNLOAD_DIR,
        BATCH_OUTPUT_DIR,
    ]:
        d.mkdir(parents=True, exist_ok=True)


def _skip_if_exists(path: Path, force: bool) -> bool:
    """Return True when an output already exists and we are not forcing overwrite."""
    if path.exists() and not force:
        print(f"Skipping; already exists: {path}")
        return True
    return False


def _parse_handle_id(view_url: str) -> str:
    """Extract the numeric handle ID from a DSpace handle URL."""
    if not view_url:
        return ""
    match = re.search(r"/handle/[^/]+/(\d+)", view_url)
    if match:
        return match.group(1)
    return re.sub(r"\W+", "_", view_url).strip("_") or view_url


def _load_index_rows(index_csv: Path) -> List[Dict[str, str]]:
    """Load the debate index CSV into a list of dict rows."""
    if not index_csv.exists():
        raise FileNotFoundError(f"Missing index CSV: {index_csv}")
    with open(index_csv, newline="", encoding="utf-8") as f:
        return list(_csv_dict_reader(f))


def _load_run_state(path: Path) -> Dict[str, object]:
    """Load run-state to resume incremental batches across runs."""
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {
        "version": 1,
        "processed_ids": [],
        "pending_ids": [],
        "current_batch": None,
        "no_pdf_retries": {},
    }


def _save_run_state(path: Path, state: Dict[str, object]) -> None:
    """Persist run-state for crash-safe resumes."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


def _compute_pending_ids(
    rows: List[Dict[str, str]], processed_ids: set[str]
) -> List[str]:
    """Compute new handle IDs that have not been processed yet."""
    pending: List[str] = []
    seen: set[str] = set()
    for row in rows:
        view_url = row.get("View_Link") or ""
        handle_id = _parse_handle_id(view_url)
        if not handle_id:
            continue
        if handle_id in processed_ids or handle_id in seen:
            continue
        pending.append(handle_id)
        seen.add(handle_id)
    return pending


def _make_batch_id(rows: List[Dict[str, str]]) -> str:
    """Create a batch identifier using timestamp + first/last handle ID."""
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    ids = [_parse_handle_id(r.get("View_Link") or "") for r in rows]
    ids = [i for i in ids if i]
    first_id = ids[0] if ids else "unknown"
    last_id = ids[-1] if ids else "unknown"
    return f"{ts}_{first_id}_{last_id}"


def _batch_paths(batch_id: str) -> Dict[str, Path]:
    """Compute all output file paths for a batch."""
    batch_dir = BATCH_OUTPUT_DIR / batch_id
    return {
        "dir": batch_dir,
        "merged_pdf": batch_dir / "merged.pdf",
        "aggressive_csv": batch_dir / "aggressive.csv",
        "merged_csv": batch_dir / "merged.csv",
        "translated_csv": batch_dir / "translated.csv",
        "final_csv": batch_dir / "final.csv",
        "scores_json": batch_dir / "scores.json",
        "evidence_json": batch_dir / "evidence.json",
        "score_checkpoint": batch_dir / "score_checkpoint.json",
        "dataset_csv": batch_dir / "dataset.csv",
        "dataset_json": batch_dir / "dataset.json",
        "meta_json": batch_dir / "meta.json",
    }


def _write_batch_metadata(
    path: Path, batch_id: str, rows: List[Dict[str, str]]
) -> Dict[str, object]:
    """Write a metadata file describing which sources contributed to a batch."""
    dates = [r.get("Date") for r in rows if r.get("Date")]
    start_date = dates[-1] if dates else None
    end_date = dates[0] if dates else None
    source_links = [r.get("View_Link") for r in rows if r.get("View_Link")]
    source_ids = [_parse_handle_id(u or "") for u in source_links]
    meta = {
        "batch_id": batch_id,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "source_count": len(rows),
        "start_date": start_date,
        "end_date": end_date,
        "source_ids": source_ids,
        "source_links": source_links,
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    return meta


def _export_dataset(in_csv: Path, batch_id: str, out_csv: Path, out_json: Path) -> None:
    """Export the final batch dataset as both CSV and JSON."""
    import pandas as pd

    df = pd.read_csv(in_csv)
    df.insert(0, "batch_id", batch_id)
    out_csv.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out_csv, index=False)
    out_json.write_text(
        df.to_json(orient="records", force_ascii=False, indent=2),
        encoding="utf-8",
    )


def _ensure_db(db_path: Path) -> sqlite3.Connection:
    """Initialize SQLite schema and return a ready connection."""
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("""
        CREATE TABLE IF NOT EXISTS batches (
            batch_id TEXT PRIMARY KEY,
            created_at TEXT,
            start_date TEXT,
            end_date TEXT,
            source_count INTEGER,
            source_ids TEXT,
            source_links TEXT
        )
        """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS speeches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id TEXT,
            speaker TEXT,
            speech TEXT
        )
        """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_speeches_batch ON speeches(batch_id)")
    conn.execute("""
        CREATE TABLE IF NOT EXISTS scores (
            batch_id TEXT,
            mp_name TEXT,
            core_value TEXT,
            score REAL,
            PRIMARY KEY (batch_id, mp_name, core_value)
        )
        """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS score_evidence (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            batch_id TEXT,
            mp_name TEXT,
            core_value TEXT,
            score REAL,
            speech TEXT,
            row_index INTEGER
        )
        """)
    return conn


def _db_upsert_batch(conn: sqlite3.Connection, meta: Dict[str, object]) -> None:
    """Insert or update a batch metadata record."""
    conn.execute(
        """
        INSERT OR REPLACE INTO batches (
            batch_id, created_at, start_date, end_date, source_count,
            source_ids, source_links
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            meta.get("batch_id"),
            meta.get("created_at"),
            meta.get("start_date"),
            meta.get("end_date"),
            meta.get("source_count"),
            json.dumps(meta.get("source_ids", []), ensure_ascii=False),
            json.dumps(meta.get("source_links", []), ensure_ascii=False),
        ),
    )


def _db_insert_speeches(
    conn: sqlite3.Connection, batch_id: str, dataset_csv: Path
) -> None:
    """Insert speech rows for a batch from the dataset CSV."""
    conn.execute("DELETE FROM speeches WHERE batch_id = ?", (batch_id,))
    with open(dataset_csv, newline="", encoding="utf-8") as f:
        reader = _csv_dict_reader(f)
        batch: List[Tuple[str, str, str]] = []
        for row in reader:
            speaker = row.get("Speaker") or ""
            speech = row.get("Speech") or ""
            batch.append((batch_id, speaker, speech))
            if len(batch) >= 1000:
                conn.executemany(
                    "INSERT INTO speeches (batch_id, speaker, speech) VALUES (?, ?, ?)",
                    batch,
                )
                batch = []
        if batch:
            conn.executemany(
                "INSERT INTO speeches (batch_id, speaker, speech) VALUES (?, ?, ?)",
                batch,
            )


def _db_insert_scores(
    conn: sqlite3.Connection,
    batch_id: str,
    scores_json: Path,
    evidence_json: Path,
) -> None:
    """Insert aggregated scores and per-speech evidence for a batch."""
    conn.execute("DELETE FROM scores WHERE batch_id = ?", (batch_id,))
    conn.execute("DELETE FROM score_evidence WHERE batch_id = ?", (batch_id,))

    if not scores_json.exists() or not evidence_json.exists():
        print(f"Warning: Scores or Evidence file missing for batch {batch_id}. Skipping DB insert.")
        return

    try:
        scores = json.loads(scores_json.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"Error reading scores JSON: {e}")
        scores = []
    rows: List[Tuple[str, str, str, float]] = []
    for entry in scores:
        mp_name = entry.get("mp_name")
        core_scores = entry.get("core_values_score", {})
        for label, score in core_scores.items():
            rows.append((batch_id, mp_name, label, float(score)))
    if rows:
        conn.executemany(
            "INSERT INTO scores (batch_id, mp_name, core_value, score) VALUES (?, ?, ?, ?)",
            rows,
        )

    evidence = json.loads(evidence_json.read_text(encoding="utf-8"))
    ev_rows: List[Tuple[str, str, str, float, str, int]] = []
    for entry in evidence:
        ev_rows.append(
            (
                batch_id,
                entry.get("mp_name"),
                entry.get("core_value"),
                float(entry.get("score", 0.0)),
                entry.get("speech"),
                int(entry.get("row_index", 0)),
            )
        )
    if ev_rows:
        conn.executemany(
            """
            INSERT INTO score_evidence
            (batch_id, mp_name, core_value, score, speech, row_index)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            ev_rows,
        )


def _clear_dir_contents(path: Path) -> None:
    """Delete all files and folders inside a directory (but keep the directory)."""
    if not path.exists():
        return
    for child in path.iterdir():
        if child.is_dir():
            shutil.rmtree(child, ignore_errors=True)
        else:
            try:
                child.unlink()
            except FileNotFoundError:
                pass


def _cleanup_residue() -> None:
    """Remove temporary download and interim artifacts."""
    _clear_dir_contents(DOWNLOAD_DIR)
    _clear_dir_contents(INTERIM_DIR)


def _cleanup_batch_outputs(batch_id: str) -> None:
    """Delete intermediate batch files, keeping final artifacts and metadata."""
    paths = _batch_paths(batch_id)
    for key in [
        "merged_pdf",
        "aggressive_csv",
        "merged_csv",
        "translated_csv",
        "final_csv",
        "score_checkpoint",
    ]:
        path = paths.get(key)
        if path and path.exists():
            try:
                path.unlink()
            except FileNotFoundError:
                pass


# ---------------------------
# STEP 1: MP LIST SCRAPE
# ---------------------------


def step_scrape_mps(url: str, out_file: Path, force: bool) -> None:
    """Scrape MP names and constituencies from Wikipedia into a text file."""
    if _skip_if_exists(out_file, force):
        return

    import requests
    from bs4 import BeautifulSoup

    print(f"Fetching MP list: {url}")
    res = requests.get(url, headers=DEFAULT_HEADERS, timeout=30)
    res.raise_for_status()

    soup = BeautifulSoup(res.text, "html.parser")
    output_lines: List[str] = []

    for table in soup.find_all("table", {"class": "wikitable"}):
        for row in table.find_all("tr")[1:]:
            cells = row.find_all("td")
            if len(cells) >= 2:
                constituency = cells[0].get_text(strip=True)
                name = cells[1].get_text(strip=True)
                if name and constituency:
                    output_lines.append(f"{name} \u2014 {constituency}")

    out_file.parent.mkdir(parents=True, exist_ok=True)
    out_file.write_text("\n".join(output_lines), encoding="utf-8")
    print(f"Done. MPs written: {len(output_lines)}")


# ---------------------------
# STEP 2: DOWNLOAD + MERGE PDFS
# ---------------------------


def _has_mb(size_text: str) -> bool:
    """Return True if the size text indicates MB (used to prefer larger PDFs)."""
    return bool(re.search(r"\d+(\.\d+)?\s*MB", size_text, re.IGNORECASE))


def _download_pdf(url: str, filename: str, session=None) -> Path:
    """Download a PDF file and return the local path."""
    import requests

    client = session or requests
    res = client.get(url, headers=DEFAULT_HEADERS, stream=True, timeout=30)
    res.raise_for_status()

    path = DOWNLOAD_DIR / filename
    with open(path, "wb") as f:
        for chunk in res.iter_content(8192):
            f.write(chunk)

    print(f"Downloaded: {filename}")
    return path


def _build_session():
    """Build a requests session with retries and browser-like headers."""
    import requests
    from requests.adapters import HTTPAdapter
    from urllib3.util.retry import Retry

    session = requests.Session()
    session.headers.update(DEFAULT_HEADERS)

    # Retry transient failures (rate limits / gateway errors).
    retry = Retry(
        total=3,
        backoff_factor=0.6,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=("GET", "HEAD"),
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


def _fetch_html(session, url: str) -> tuple[Optional[str], str]:
    """Fetch a page and optionally fall back to alternate view URLs."""
    import requests
    import time

    def _try_get(target: str):
        for attempt in range(3):
            try:
                # Add a small delay to avoid hitting rate limits too fast
                time.sleep(1)
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
                res = session.get(target, headers=headers, timeout=15)
                return res
            except requests.RequestException as exc:
                print(f"Page open failed (attempt {attempt+1}/3): {exc}")
                if attempt < 2:
                    time.sleep(2**attempt)  # Exponential backoff: 1s, 2s
        return None

    res = _try_get(url)
    if res is None:
        return None, url

    if res.status_code == 404:
        alternates = []
        if "view_type=browse" in url:
            alternates.append(url.replace("view_type=browse", "view_type=detail"))
            alternates.append(url.split("?", 1)[0])

        for alt in alternates:
            res = _try_get(alt)
            if res is None:
                continue
            if res.status_code != 404:
                url = alt
                break

    try:
        if res is not None:
            res.raise_for_status()
        else:
            return None, url
    except requests.RequestException as exc:
        print(f"Page open failed: {exc}")
        return None, url

    return res.text if res else None, url


def step_download_pdfs(
    index_csv: Path,
    start: int,
    end: int,
    pages_to_remove: int,
    out_pdf: Path,
    force: bool,
    rows: Optional[List[Dict[str, str]]] = None,
) -> None:
    """Download PDFs for the given rows and merge into a single PDF."""
    if _skip_if_exists(out_pdf, force):
        return

    from bs4 import BeautifulSoup
    from urllib.parse import urljoin
    from pypdf import PdfReader, PdfWriter

    if rows is None:
        if not index_csv.exists():
            raise FileNotFoundError(f"Missing index CSV: {index_csv}")

        with open(index_csv, newline="", encoding="utf-8") as f:
            rows = list(_csv_dict_reader(f))

        if not rows:
            raise RuntimeError("Index CSV is empty")

        start = max(1, start)
        if end <= 0:
            end = len(rows)
        end = min(end, len(rows))

        selected = rows[start - 1 : end]
    else:
        selected = rows

    if not selected:
        raise RuntimeError("No rows selected for download.")
    downloaded_files: List[Path] = []

    session = _build_session()

    for idx, row in enumerate(selected, start=start):
        view_url = row.get("View_Link")
        date = (row.get("Date") or "unknown").replace("-", "_")

        if not view_url:
            print(f"[{idx}] Missing View_Link, skipping")
            continue

        print(f"[{idx}] Opening: {view_url}")
        html, effective_url = _fetch_html(session, view_url)
        if not html:
            continue

        soup = BeautifulSoup(html, "html.parser")
        panel = soup.find("div", class_="panel-info")
        if panel:
            for tr in panel.find_all("tr")[1:]:
                tds = tr.find_all("td")
                if len(tds) < 5:
                    continue

                file_name = tds[0].get_text(strip=True)
                size_text = tds[2].get_text(strip=True)
                open_btn = tds[4].find("a")
                if not open_btn:
                    continue

                if _has_mb(size_text) or not size_text:
                    pdf_url = urljoin(effective_url, open_btn.get("href"))
                    safe_name = f"{date}_{file_name}"
                    try:
                        path = _download_pdf(
                            pdf_url, safe_name, session=session
                        )
                        downloaded_files.append(path)
                    except Exception as e:
                        print(f"Download failed: {e}")
                else:
                    print(f"Skipped (size: {size_text})")
        else:
            # Fallback: find any PDF-like links on the page.
            pdf_links = []
            for a in soup.find_all("a", href=True):
                href = a["href"]
                href_lower = href.lower()
                if ".pdf" in href_lower or "/bitstream/" in href_lower:
                    pdf_links.append(href)

            if not pdf_links:
                print("No file table found")
                continue

            for href in pdf_links:
                pdf_url = urljoin(effective_url, href)
                file_name = Path(href).name or "document.pdf"
                safe_name = f"{date}_{file_name}"
                try:
                    path = _download_pdf(pdf_url, safe_name, session=session)
                    downloaded_files.append(path)
                except Exception as e:
                    print(f"Download failed: {e}")

    if not downloaded_files:
        raise NoPdfsDownloadedError("No PDFs downloaded. Aborting merge.")

    writer = PdfWriter()
    total_pages = 0

    print("Merging PDFs...")
    for pdf_file in sorted(downloaded_files):
        try:
            reader = PdfReader(pdf_file)
            for page in reader.pages:
                writer.add_page(page)
                total_pages += 1
        except Exception as exc:
            print(f"Failed to read original PDF to determine pages: {exc}")

    if int(total_pages) <= int(pages_to_remove):
        raise RuntimeError("Not enough pages to remove.")

    final_writer = PdfWriter()
    for i in range(pages_to_remove, total_pages):
        final_writer.add_page(writer.pages[i])

    out_pdf.parent.mkdir(parents=True, exist_ok=True)
    with open(out_pdf, "wb") as f:
        final_writer.write(f)

    print(f"Merged PDF saved: {out_pdf}")
    print(f"Total pages after trimming: {total_pages - pages_to_remove}")


# ---------------------------
# STEP 3: EXTRACT SPEECHES
# ---------------------------


def _clean_speech(text: str) -> str:
    """Remove common artifacts from extracted speech text."""
    text = re.sub(r"\.\.\. \(.*?\)", "", text)
    text = re.sub(r"\(Interruptions\)", "", text, flags=re.IGNORECASE)
    return text.strip()


def step_extract_speeches(pdf_path: Path, out_csv: Path, force: bool) -> None:
    """Extract speeches from a merged PDF into a raw CSV."""
    if _skip_if_exists(out_csv, force):
        return

    import pdfplumber

    if not pdf_path.exists():
        raise FileNotFoundError(f"Missing PDF: {pdf_path}")

    out_csv.parent.mkdir(parents=True, exist_ok=True)

    current_speaker: Optional[str] = None
    current_speech: List[str] = []

    total_lines = 0
    speaker_hits = 0

    with pdfplumber.open(str(pdf_path)) as pdf, open(
        out_csv, "w", newline="", encoding="utf-8"
    ) as out:
        writer = csv.writer(out)
        writer.writerow(["Speaker", "Speech"])

        for page in pdf.pages:
            text = page.extract_text() or ""
            lines = text.split("\n")

            for raw in lines:
                total_lines += 1
                line = raw.strip()

                if not line:
                    continue
                if line == "\f":
                    continue
                if HEADER_RE.match(line):
                    continue
                if NOISE_RE.match(line):
                    continue

                if SPEAKER_RE.match(line):
                    speaker_hits += 1

                    if current_speaker and current_speech:
                        writer.writerow(
                            [
                                current_speaker,
                                _clean_speech(" ".join(current_speech)),
                            ]
                        )

                    if "\u0903" in line:
                        spk, rest = line.split("\u0903", 1)
                    else:
                        spk, rest = line.split(":", 1)

                    current_speaker = spk.strip()
                    current_speech = [rest.strip()] if rest.strip() else []
                else:
                    if current_speaker:
                        current_speech.append(line)

        if current_speaker and current_speech:
            writer.writerow([current_speaker, _clean_speech(" ".join(current_speech))])

    print("DONE")
    print(f"Total lines read: {total_lines}")
    print(f"Speaker starts detected: {speaker_hits}")


# ---------------------------
# STEP 4: MERGE CONSECUTIVE SPEECHES
# ---------------------------


def step_merge_speeches(in_csv: Path, out_csv: Path, force: bool) -> None:
    """Merge consecutive rows from the same speaker to reduce fragmentation."""
    if _skip_if_exists(out_csv, force):
        return

    if not in_csv.exists():
        raise FileNotFoundError(f"Missing CSV: {in_csv}")

    merged_rows: List[Dict[str, str]] = []
    prev_speaker: Optional[str] = None
    prev_speech: List[str] = []

    with open(in_csv, newline="", encoding="utf-8") as f:
        reader = _csv_dict_reader(f)
        for row in reader:
            speaker = (row.get("Speaker") or "").strip()
            speech = (row.get("Speech") or "").strip()

            if not speaker:
                continue

            if speaker == prev_speaker:
                prev_speech.append(speech)
            else:
                if prev_speaker is not None:
                    merged_rows.append(
                        {
                            "Speaker": prev_speaker,
                            "Speech": " ".join(prev_speech).strip(),
                        }
                    )

                prev_speaker = speaker
                prev_speech = [speech]

        if prev_speaker is not None:
            merged_rows.append(
                {"Speaker": prev_speaker, "Speech": " ".join(prev_speech).strip()}
            )

    out_csv.parent.mkdir(parents=True, exist_ok=True)
    with open(out_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["Speaker", "Speech"])
        writer.writeheader()
        writer.writerows(merged_rows)

    print(f"Merged speeches: {len(merged_rows)}")


# ---------------------------
# STEP 5: TRANSLATE + CLEAN
# ---------------------------


def _load_translation_cache(path: Path) -> Dict[str, str]:
    """Load translation cache to avoid duplicate translation calls."""
    if path.exists():
        try:
            cache: Dict[str, str] = json.loads(path.read_text(encoding="utf-8"))
            return cache
        except Exception:
            return {}
    return {}


def _save_translation_cache(path: Path, cache: Dict[str, str]) -> None:
    """Persist translation cache to disk."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")


def step_translate_clean(
    in_csv: Path,
    mp_list_file: Path,
    out_csv: Path,
    cache_file: Path,
    force: bool,
    const_threshold: int = 75,
    name_threshold: int = 85,
) -> None:
    """Normalize speaker names, translate speeches, and clean text."""
    if _skip_if_exists(out_csv, force):
        return

    import pandas as pd
    from fuzzywuzzy import process
    from tqdm import tqdm
    from transformers import pipeline
    import torch

    if not in_csv.exists():
        raise FileNotFoundError(f"Missing CSV: {in_csv}")
    if not mp_list_file.exists():
        raise FileNotFoundError(f"Missing MP list: {mp_list_file}")

    print("Loading local translation model (Helsinki-NLP/opus-mt-hi-en)...")
    device = 0 if torch.cuda.is_available() else -1
    translator = None
    output_keys = ("translation_text", "generated_text", "text")
    translator_task = None
    last_error = None

    for task_name in ("translation_hi_to_en", "translation", "text2text-generation"):
        try:
            translator = pipeline(
                task_name,
                model="Helsinki-NLP/opus-mt-hi-en",
                device=device,
            )
            translator_task = task_name
            break
        except Exception as exc:
            last_error = exc
            print(f"Translator task '{task_name}' unavailable: {exc}")

    if translator is not None:
        print(f"Translator task: {translator_task}")
    else:
        print(
            "Warning: no compatible translation task was available; "
            "continuing without translation."
        )
        if last_error is not None:
            print(f"Last translation init error: {last_error}")

    translation_cache = _load_translation_cache(cache_file)

    def translate_force(text: str, retries: int = 1, delay: float = 0.0) -> str:
        if not isinstance(text, str) or not text.strip():
            return ""
        if text in translation_cache:
            return translation_cache[text]

        # Quick skip for tiny texts if necessary, though local is fast enough
        if len(text.strip()) < 3 and not re.search(r"[\u0900-\u097F]", text):
            return text

        if translator is None:
            translation_cache[text] = text
            return text

        try:
            # Process long texts by chunking if needed, but standard model usually handles up to 512 tokens.
            # Truncate overly long single text blocks for safety, or pass directly to pipeline
            result = translator(text[:1500])
            if isinstance(result, list) and len(result) > 0 and isinstance(result[0], dict):
                out = ""
                for key in output_keys:
                    candidate = result[0].get(key, "")
                    if isinstance(candidate, str) and candidate.strip():
                        out = candidate.strip()
                        break
                if out and out != text:
                    translation_cache[text] = out
                    return out
        except Exception as e:
            print(f"Translation error: {e}")

        translation_cache[text] = text
        return text

    def normalize_ocr_hindi(text: str) -> str:
        if not isinstance(text, str):
            return text

        replacements = {
            "\u0926\u0915": "\u0915\u093f",
            "\u0939\u0902": "\u0939\u0948\u0902",
            "\u0930\u0930": "\u0930\u093f",
            "\u0902": "",
            "\u094d\u200d": "",
            "\u0926\u0935": "\u0935\u093f",
            "\u0926\u0936": "\u0936",
            "\u0926\u092d": "\u092d",
        }

        for k, v in replacements.items():
            text = text.replace(k, v)

        return text

    valid_map: Dict[str, str] = {}
    reverse_map: Dict[str, str] = {}

    for line in mp_list_file.read_text(encoding="utf-8").splitlines():
        if " \u2014 " in line:
            name, const = line.strip().split(" \u2014 ", 1)
            valid_map[const.lower().strip()] = name.strip()
            reverse_map[name.lower().strip()] = const.strip()

    valid_constituencies = list(valid_map.keys())
    valid_names = list(reverse_map.keys())

    def get_valid_name(speaker: str) -> Optional[str]:
        if not isinstance(speaker, str):
            return None

        match = re.search(r"\((.*?)\)", speaker)
        if match:
            const = translate_force(match.group(1)).lower()
            best = process.extractOne(const, valid_constituencies)
            if best and best[1] >= const_threshold:
                c = best[0]
                return f"{valid_map[c]} \u2014 {c.title()}"

        eng_name = translate_force(speaker).lower()
        best = process.extractOne(eng_name, valid_names)
        if best and best[1] >= name_threshold:
            n = best[0]
            return f"{n.title()} \u2014 {reverse_map[n].title()}"

        return None

    junk_pattern_1 = re.compile(r"\(.*?\d+/[A-Z]+/[A-Z]+\)")
    junk_pattern_2 = re.compile(
        r"\d+-\d+-\d+.*?Uncorrected/Notforpublication.*?\d+",
        re.DOTALL,
    )

    def clean_and_translate_speech(text: str) -> str:
        if not isinstance(text, str):
            return ""

        text = junk_pattern_1.sub("", text)
        text = junk_pattern_2.sub("", text)
        text = normalize_ocr_hindi(text)
        return translate_force(text).strip()

    print("Reading CSV...")
    df = pd.read_csv(in_csv)

    print("Normalizing Speakers...")
    df["Speaker"] = [
        get_valid_name(s) for s in tqdm(df["Speaker"], desc="Speakers", total=len(df))
    ]

    print("Dropping invalid MPs...")
    df = df[df["Speaker"].notna()].reset_index(drop=True)

    print("Cleaning & translating speeches...")
    df["Speech"] = [
        clean_and_translate_speech(s)
        for s in tqdm(df["Speech"], desc="Speeches", total=len(df))
    ]

    print("Final normalization...")
    df = df.replace(r"\s+", " ", regex=True)

    out_csv.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out_csv, index=False)
    _save_translation_cache(cache_file, translation_cache)

    print(f"Saved: {out_csv}")
    print(f"Cached translations: {len(translation_cache)}")


# ---------------------------
# STEP 6: REMOVE HINDI
# ---------------------------


def step_remove_hindi(in_csv: Path, out_csv: Path, force: bool) -> None:
    """Drop rows that still contain Hindi text after translation."""
    if _skip_if_exists(out_csv, force):
        return

    import pandas as pd

    if not in_csv.exists():
        raise FileNotFoundError(f"Missing CSV: {in_csv}")

    print("Reading final CSV...")
    df = pd.read_csv(in_csv)

    def has_hindi(text: str) -> bool:
        if not isinstance(text, str):
            return False
        return bool(HINDI_REGEX.search(text))

    print("Removing rows containing Hindi text...")
    mask = df["Speaker"].apply(has_hindi) | df["Speech"].apply(has_hindi)
    removed = int(mask.sum())
    initial_count = len(df)
    
    if removed == initial_count and initial_count > 0:
        print("Warning: All rows contain Hindi. Keeping them to avoid empty batch.")
    else:
        df = df[~mask]
        print(f"Removed rows containing Hindi: {removed}")

    out_csv.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out_csv, index=False)
    print(f"Saved clean file: {out_csv}")


# ---------------------------
# STEP 7: SCORE
# ---------------------------


def step_score(
    in_csv: Path,
    model_path: Path,
    score_threshold: float,
    use_gpu: bool,
    force: bool,
    scores_file: Optional[Path] = None,
    evidence_file: Optional[Path] = None,
    checkpoint_file: Optional[Path] = None,
) -> None:
    """Score speeches with the regression model and store evidence."""
    scores_file = scores_file or SCORES_FILE
    evidence_file = evidence_file or EVIDENCE_FILE
    checkpoint_file = checkpoint_file or CHECKPOINT_FILE

    if _skip_if_exists(scores_file, force):
        return

    import torch
    import pandas as pd
    from transformers import AutoTokenizer, AutoModel
    from collections import defaultdict
    from tqdm import tqdm

    if not in_csv.exists():
        raise FileNotFoundError(f"Missing CSV: {in_csv}")
    if not model_path.exists():
        raise FileNotFoundError(f"Missing model file: {model_path}")

    device = "cuda" if (use_gpu and torch.cuda.is_available()) else "cpu"
    batch_size = 16 if device == "cuda" else 64
    print(f"Running on {device.upper()} | Batch size = {batch_size}")

    checkpoint = torch.load(model_path, map_location=device)
    model_name = checkpoint["model_name"]

    tokenizer = AutoTokenizer.from_pretrained(model_name)

    class RobertaMultiRegressor(torch.nn.Module):
        def __init__(self) -> None:
            super().__init__()
            self.encoder = AutoModel.from_pretrained(model_name)
            hidden = self.encoder.config.hidden_size
            self.head = torch.nn.Linear(hidden, len(LABELS))

        def forward(self, input_ids, attention_mask):
            out = self.encoder(input_ids=input_ids, attention_mask=attention_mask)
            cls = out.last_hidden_state[:, 0, :]
            scores = self.head(cls)
            return torch.clamp(scores, 0, 10)

    model = RobertaMultiRegressor().to(device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    df = pd.read_csv(in_csv)
    df["name"] = df["Speaker"].str.split(" \u2014 ").str[0]

    start_idx = 0
    mp_scores = defaultdict(lambda: {v: 0.0 for v in LABELS if v != "NONE"})
    score_evidence: List[Dict[str, object]] = []

    if checkpoint_file.exists():
        ck = json.loads(checkpoint_file.read_text(encoding="utf-8"))
        start_idx = int(ck.get("last_index", 0))
        for mp, scores in ck.get("mp_scores", {}).items():
            mp_scores[mp] = scores
        print(f"Resuming from row {start_idx}")

    if evidence_file.exists():
        score_evidence = json.loads(evidence_file.read_text(encoding="utf-8"))
        print(f"Loaded evidence: {len(score_evidence)}")

    texts: List[str] = []
    speakers: List[str] = []
    row_indices: List[int] = []

    with torch.no_grad():
        for idx in tqdm(range(start_idx, len(df)), desc="Scoring speeches"):
            row = df.iloc[idx]
            texts.append(row["Speech"])
            speakers.append(row["name"])
            row_indices.append(idx)

            if len(texts) == batch_size or idx == len(df) - 1:
                enc = tokenizer(
                    texts,
                    padding=True,
                    truncation=True,
                    max_length=256,
                    return_tensors="pt",
                ).to(device)

                preds = model(enc["input_ids"], enc["attention_mask"])

                for speaker, text, scores, row_idx in zip(
                    speakers, texts, preds, row_indices
                ):
                    scores = scores.cpu().tolist()
                    for label, score in zip(LABELS, scores):
                        if label == "NONE":
                            continue
                        if score >= score_threshold:
                            mp_scores[speaker][label] += score
                            score_evidence.append(
                                {
                                    "mp_name": speaker,
                                    "core_value": label,
                                    "score": round(score, 4),
                                    "speech": text,
                                    "row_index": row_idx,
                                }
                            )

                checkpoint_file.write_text(
                    json.dumps(
                        {"last_index": idx + 1, "mp_scores": dict(mp_scores)},
                        ensure_ascii=False,
                    ),
                    encoding="utf-8",
                )

                evidence_file.write_text(
                    json.dumps(score_evidence, ensure_ascii=False, indent=2),
                    encoding="utf-8",
                )

                texts, speakers, row_indices = [], [], []

    final_output = [
        {
            "mp_name": mp,
            "core_values_score": {k: round(v, 2) for k, v in scores.items()},
        }
        for mp, scores in mp_scores.items()
    ]

    scores_file.write_text(
        json.dumps(final_output, ensure_ascii=False, indent=4), encoding="utf-8"
    )

    print("DONE - scoring complete")
    print(f"MPs scored: {len(final_output)}")
    print(f"Evidence entries: {len(score_evidence)}")


# ---------------------------
# STEP 8: BATCH ORCHESTRATION
# ---------------------------


def _run_batch_pipeline(
    batch_rows: List[Dict[str, str]],
    batch_id: str,
    pages_to_remove: int,
    score_threshold: float,
    use_gpu: bool,
    state: Dict[str, object],
) -> None:
    """Run the end-to-end pipeline for a single batch with step checkpoints."""
    batch = state.get("current_batch") or {}
    completed = set(batch.get("completed_steps") or [])

    paths = _batch_paths(batch_id)
    paths["dir"].mkdir(parents=True, exist_ok=True)

    def mark(step: str) -> None:
        if step not in completed:
            completed.add(step)
            batch["completed_steps"] = sorted(completed)
            state["current_batch"] = batch
            _save_run_state(RUN_STATE_FILE, state)

    meta: Dict[str, object]
    if "metadata" in completed and paths["meta_json"].exists():
        meta = json.loads(paths["meta_json"].read_text(encoding="utf-8"))
    else:
        meta = _write_batch_metadata(paths["meta_json"], batch_id, batch_rows)
        mark("metadata")

    if "download" not in completed:
        _clear_dir_contents(DOWNLOAD_DIR)
        step_download_pdfs(
            DEBATE_INDEX_CSV,
            1,
            len(batch_rows),
            pages_to_remove,
            paths["merged_pdf"],
            True,
            rows=batch_rows,
        )
        mark("download")

    if "extract" not in completed:
        step_extract_speeches(paths["merged_pdf"], paths["aggressive_csv"], True)
        mark("extract")

    if "merge" not in completed:
        step_merge_speeches(paths["aggressive_csv"], paths["merged_csv"], True)
        mark("merge")

    if "translate" not in completed:
        step_translate_clean(
            paths["merged_csv"],
            MP_LIST_FILE,
            paths["translated_csv"],
            TRANSLATION_CACHE,
            True,
        )
        mark("translate")

    if "remove_hindi" not in completed:
        step_remove_hindi(paths["translated_csv"], paths["final_csv"], True)
        mark("remove_hindi")

    if "score" not in completed:
        step_score(
            paths["final_csv"],
            MODEL_PATH,
            score_threshold,
            use_gpu,
            True,
            scores_file=paths["scores_json"],
            evidence_file=paths["evidence_json"],
            checkpoint_file=paths["score_checkpoint"],
        )
        mark("score")

    if "dataset" not in completed:
        _export_dataset(
            paths["final_csv"], batch_id, paths["dataset_csv"], paths["dataset_json"]
        )
        mark("dataset")

    if "db" not in completed:
        conn = _ensure_db(DB_FILE)
        _db_upsert_batch(conn, meta)
        _db_insert_speeches(conn, batch_id, paths["dataset_csv"])
        _db_insert_scores(conn, batch_id, paths["scores_json"], paths["evidence_json"])
        conn.commit()
        conn.close()
        mark("db")


def run_incremental_batches(
    index_csv: Path,
    batch_size: int,
    pages_to_remove: int,
    score_threshold: float,
    use_gpu: bool,
    force: bool,
) -> None:
    """Process new debate rows in fixed-size batches and resume safely on reruns."""
    batch_size = max(1, int(batch_size))
    if force:
        _clear_dir_contents(BATCH_OUTPUT_DIR)
        if RUN_STATE_FILE.exists():
            RUN_STATE_FILE.unlink()
        if DB_FILE.exists():
            DB_FILE.unlink()

    step_scrape_mps(DEFAULT_MPS_URL, MP_LIST_FILE, force)

    rows = _load_index_rows(index_csv)
    if not rows:
        print("Index CSV is empty. Nothing to process.")
        return

    row_map = {_parse_handle_id(r.get("View_Link") or ""): r for r in rows}
    state = _load_run_state(RUN_STATE_FILE)

    processed_ids = set(state.get("processed_ids") or [])
    pending_ids = list(state.get("pending_ids") or [])
    no_pdf_retries: Dict[str, int] = dict(state.get("no_pdf_retries") or {})
    current = state.get("current_batch")

    while True:
        if current:
            ids = list(current.get("ids") or [])
            batch_id = current.get("batch_id")
        else:
            if not pending_ids:
                pending_ids = _compute_pending_ids(rows, processed_ids)
                state["pending_ids"] = pending_ids
                _save_run_state(RUN_STATE_FILE, state)

            if not pending_ids:
                print("No new items to process.")
                return

            ids = pending_ids[:batch_size]
            batch_rows = [row_map.get(i) for i in ids if row_map.get(i)]
            missing = [i for i in ids if i not in row_map]
            if missing:
                print(f"Missing rows for IDs, skipping: {missing}")
                processed_ids.update(missing)
                pending_ids = [i for i in pending_ids if i not in missing]
                state["processed_ids"] = sorted(processed_ids)
                state["pending_ids"] = pending_ids
                _save_run_state(RUN_STATE_FILE, state)
                continue

            batch_id = _make_batch_id(batch_rows)
            current = {
                "batch_id": batch_id,
                "ids": ids,
                "completed_steps": [],
                "started_at": datetime.utcnow().isoformat() + "Z",
            }
            state["current_batch"] = current
            state["pending_ids"] = pending_ids
            _save_run_state(RUN_STATE_FILE, state)

        batch_rows = [row_map.get(i) for i in ids if row_map.get(i)]
        if not batch_rows:
            print("No valid rows found for current batch. Skipping.")
            processed_ids.update(ids)
            pending_ids = [i for i in pending_ids if i not in ids]
            state["processed_ids"] = sorted(processed_ids)
            state["pending_ids"] = pending_ids
            state["current_batch"] = None
            _save_run_state(RUN_STATE_FILE, state)
            current = None
            continue

        try:
            _run_batch_pipeline(
                batch_rows,
                batch_id,
                pages_to_remove,
                score_threshold,
                use_gpu,
                state,
            )
        except NoPdfsDownloadedError as exc:
            retry_key = "|".join(sorted(ids))
            retry_count = int(no_pdf_retries.get(retry_key, 0)) + 1
            no_pdf_retries[retry_key] = retry_count

            if retry_count < MAX_NO_PDF_RETRIES:
                print(
                    f"Retrying batch {batch_id} later (no PDFs downloaded, "
                    f"attempt {retry_count}/{MAX_NO_PDF_RETRIES})."
                )
                pending_ids = [i for i in pending_ids if i not in ids] + ids
            else:
                print(
                    f"Skipping batch {batch_id} after {retry_count} no-PDF attempts."
                )
                processed_ids.update(ids)
                pending_ids = [i for i in pending_ids if i not in ids]

            state["processed_ids"] = sorted(processed_ids)
            state["pending_ids"] = pending_ids
            state["current_batch"] = None
            state["no_pdf_retries"] = no_pdf_retries
            _save_run_state(RUN_STATE_FILE, state)
            _cleanup_batch_outputs(batch_id)
            _cleanup_residue()
            current = None
            continue
        except Exception as exc:

            print(f"Batch failed: {exc}")
            raise

        processed_ids.update(ids)
        pending_ids = [i for i in pending_ids if i not in ids]
        state["processed_ids"] = sorted(processed_ids)
        state["pending_ids"] = pending_ids
        state["no_pdf_retries"] = no_pdf_retries
        state["current_batch"] = None
        _save_run_state(RUN_STATE_FILE, state)
        _cleanup_batch_outputs(batch_id)
        _cleanup_residue()

        current = None
        if not pending_ids:
            pending_ids = _compute_pending_ids(rows, processed_ids)
            state["pending_ids"] = pending_ids
            _save_run_state(RUN_STATE_FILE, state)
            if not pending_ids:
                print("All pending batches processed.")
                return


# ---------------------------
# CLI
# ---------------------------


def _add_common_args(p: argparse.ArgumentParser) -> None:
    p.add_argument("--force", action="store_true", help="Overwrite outputs")


def _add_download_args(p: argparse.ArgumentParser) -> None:
    p.add_argument("--start", type=int, default=1, help="Start index (1-based)")
    p.add_argument("--end", type=int, default=1, help="End index (inclusive)")
    p.add_argument(
        "--pages-to-remove",
        type=int,
        default=13,
        help="Pages to remove from the start of merged PDF",
    )


def _add_batch_args(p: argparse.ArgumentParser) -> None:
    p.add_argument(
        "--batch-size",
        type=int,
        default=DEFAULT_BATCH_SIZE,
        help="Max items per batch",
    )


def main() -> None:
    ensure_dirs()

    parser = argparse.ArgumentParser(description="Lok Sabha Pipeline")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_mps = sub.add_parser("scrape-mps", help="Scrape MP list from Wikipedia")
    _add_common_args(p_mps)
    p_mps.add_argument("--url", default=DEFAULT_MPS_URL)

    p_dl = sub.add_parser("download-pdfs", help="Download and merge PDFs")
    _add_common_args(p_dl)
    _add_download_args(p_dl)

    p_extract = sub.add_parser("extract-speeches", help="Extract speeches from PDF")
    _add_common_args(p_extract)

    p_merge = sub.add_parser("merge-speeches", help="Merge consecutive speeches")
    _add_common_args(p_merge)

    p_trans = sub.add_parser("translate-clean", help="Translate and clean speeches")
    _add_common_args(p_trans)

    p_rm = sub.add_parser("remove-hindi", help="Remove rows with Hindi text")
    _add_common_args(p_rm)

    p_score = sub.add_parser("score", help="Score MPs using regression model")
    _add_common_args(p_score)
    p_score.add_argument("--score-threshold", type=float, default=1.6)
    p_score.add_argument("--no-gpu", action="store_true")

    p_all = sub.add_parser("all", help="Run the full pipeline")
    _add_common_args(p_all)
    _add_download_args(p_all)
    p_all.add_argument("--score-threshold", type=float, default=1.6)
    p_all.add_argument("--no-gpu", action="store_true")

    p_auto = sub.add_parser("auto", help="Incremental batches (default 10)")
    _add_common_args(p_auto)
    _add_batch_args(p_auto)
    p_auto.add_argument(
        "--pages-to-remove",
        type=int,
        default=13,
        help="Pages to remove from the start of merged PDF",
    )
    p_auto.add_argument("--score-threshold", type=float, default=1.6)
    p_auto.add_argument("--no-gpu", action="store_true")

    args = parser.parse_args()

    if args.cmd == "scrape-mps":
        step_scrape_mps(args.url, MP_LIST_FILE, args.force)
    elif args.cmd == "download-pdfs":
        step_download_pdfs(
            DEBATE_INDEX_CSV,
            args.start,
            args.end,
            args.pages_to_remove,
            MERGED_PDF,
            args.force,
        )
    elif args.cmd == "extract-speeches":
        step_extract_speeches(MERGED_PDF, AGGRESSIVE_CSV, args.force)
    elif args.cmd == "merge-speeches":
        step_merge_speeches(AGGRESSIVE_CSV, MERGED_CSV, args.force)
    elif args.cmd == "translate-clean":
        step_translate_clean(
            MERGED_CSV,
            MP_LIST_FILE,
            TRANSLATED_CSV,
            TRANSLATION_CACHE,
            args.force,
        )
    elif args.cmd == "remove-hindi":
        step_remove_hindi(TRANSLATED_CSV, FINAL_CSV, args.force)
    elif args.cmd == "score":
        step_score(
            FINAL_CSV,
            MODEL_PATH,
            args.score_threshold,
            not args.no_gpu,
            args.force,
        )
    elif args.cmd == "all":
        step_scrape_mps(DEFAULT_MPS_URL, MP_LIST_FILE, args.force)
        step_download_pdfs(
            DEBATE_INDEX_CSV,
            args.start,
            args.end,
            args.pages_to_remove,
            MERGED_PDF,
            args.force,
        )
        step_extract_speeches(MERGED_PDF, AGGRESSIVE_CSV, args.force)
        step_merge_speeches(AGGRESSIVE_CSV, MERGED_CSV, args.force)
        step_translate_clean(
            MERGED_CSV,
            MP_LIST_FILE,
            TRANSLATED_CSV,
            TRANSLATION_CACHE,
            args.force,
        )
        step_remove_hindi(TRANSLATED_CSV, FINAL_CSV, args.force)
        step_score(
            FINAL_CSV,
            MODEL_PATH,
            args.score_threshold,
            not args.no_gpu,
            args.force,
        )
    elif args.cmd == "auto":
        run_incremental_batches(
            DEBATE_INDEX_CSV,
            args.batch_size,
            args.pages_to_remove,
            args.score_threshold,
            not args.no_gpu,
            args.force,
        )


if __name__ == "__main__":
    main()
