import json
import logging
import time
from datetime import datetime, timezone

from django.conf import settings

from .discovery import update_index_csv

logger = logging.getLogger(__name__)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _load_status() -> dict:
    path = settings.INGEST_STATUS_FILE
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _write_status(data: dict) -> None:
    path = settings.INGEST_STATUS_FILE
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def run_ingestion_cycle() -> None:
    started_at = _now_iso()
    start_time = time.time()

    status = _load_status()
    status["last_run_at"] = started_at
    status["status"] = "running"
    _write_status(status)

    update_result = None
    try:
        update_result = update_index_csv()

        import pipeline

        pipeline.ensure_dirs()
        pipeline.run_incremental_batches(
            settings.PIPELINE_INDEX_CSV,
            settings.PIPELINE_BATCH_SIZE,
            settings.PIPELINE_PAGES_TO_REMOVE,
            settings.PIPELINE_SCORE_THRESHOLD,
            settings.PIPELINE_USE_GPU,
            False,
        )

        status["status"] = "ok"
        status["last_success_at"] = started_at
    except Exception as exc:
        status["status"] = "error"
        status["last_error_at"] = started_at
        status["error"] = str(exc)
        logger.exception("Ingestion cycle failed")
        raise
    finally:
        status["duration_seconds"] = round(time.time() - start_time, 2)
        if update_result is not None:
            status["index_update"] = update_result
        _write_status(status)
