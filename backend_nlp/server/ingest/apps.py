import os
from django.apps import AppConfig
from django.conf import settings


class IngestConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "ingest"

    def ready(self) -> None:
        # ⚠️ We are disabling the in-process background scheduler.
        # It blocks server startup in production and can cause memory/thread issues.
        # Instead, ingestion should be run via via `python manage.py ingest_once` in a separate process.
        pass
