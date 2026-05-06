from django.core.management.base import BaseCommand

from ingest.runner import run_ingestion_cycle


class Command(BaseCommand):
    help = "Run a single ingestion cycle (index refresh + batch processing)."

    def handle(self, *args, **options):
        run_ingestion_cycle()
        self.stdout.write(self.style.SUCCESS("Ingestion cycle complete"))
