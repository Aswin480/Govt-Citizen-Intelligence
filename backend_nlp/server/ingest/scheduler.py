import logging
import threading
import time

from django.conf import settings

from .runner import run_ingestion_cycle

logger = logging.getLogger(__name__)
_started = False


def start_scheduler() -> None:
    global _started
    if _started:
        return
    _started = True

    thread = threading.Thread(target=_loop, name="pipeline-ingest", daemon=True)
    thread.start()
    logger.info("Ingestion scheduler started")


def _loop() -> None:
    interval = max(60, int(settings.INGEST_INTERVAL_SECONDS))

    while True:
        start = time.time()
        try:
            run_ingestion_cycle()
        except Exception:
            logger.exception("Ingestion cycle failed")

        elapsed = time.time() - start
        sleep_for = max(0, interval - elapsed)
        time.sleep(sleep_for)
