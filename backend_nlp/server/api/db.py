from contextlib import contextmanager
import sqlite3
from django.conf import settings


@contextmanager
def get_connection():
    db_path = settings.PIPELINE_DB
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()
