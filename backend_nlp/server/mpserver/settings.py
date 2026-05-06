import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BASE_DIR.parent

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "***REMOVED***")
DEBUG = os.getenv("DJANGO_DEBUG", "1").lower() in {"1", "true", "yes"}

_allowed_hosts = os.getenv("DJANGO_ALLOWED_HOSTS", "*")
if _allowed_hosts.strip() == "*":
    ALLOWED_HOSTS = ["*"]
else:
    ALLOWED_HOSTS = [h.strip() for h in _allowed_hosts.split(",") if h.strip()]

INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "api.apps.ApiConfig",
    "ingest.apps.IngestConfig",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "api.middleware.SimpleCORSMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
]

ROOT_URLCONF = "mpserver.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    }
]

WSGI_APPLICATION = "mpserver.wsgi.application"
ASGI_APPLICATION = "mpserver.asgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

LANGUAGE_CODE = "en-us"
TIME_ZONE = os.getenv("DJANGO_TIME_ZONE", "UTC")
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Pipeline config
PIPELINE_ROOT = Path(os.getenv("PIPELINE_ROOT", REPO_ROOT))
PIPELINE_INDEX_CSV = Path(
    os.getenv(
        "PIPELINE_INDEX_CSV",
        PIPELINE_ROOT / "data/raw/lok_sabha_debates_uncorrected.csv",
    )
)
PIPELINE_MP_LIST = Path(
    os.getenv(
        "PIPELINE_MP_LIST",
        PIPELINE_ROOT / "data/raw/lok_sabha_mps.txt",
    )
)
PIPELINE_DB = Path(
    os.getenv("PIPELINE_DB", PIPELINE_ROOT / "outputs/pipeline.sqlite3")
)
PIPELINE_BATCH_SIZE = int(os.getenv("PIPELINE_BATCH_SIZE", "10"))
PIPELINE_PAGES_TO_REMOVE = int(os.getenv("PIPELINE_PAGES_TO_REMOVE", "13"))
PIPELINE_SCORE_THRESHOLD = float(os.getenv("PIPELINE_SCORE_THRESHOLD", "1.6"))
PIPELINE_USE_GPU = os.getenv("PIPELINE_USE_GPU", "0").lower() in {"1", "true", "yes"}

# Ingestion scheduler config
INGEST_ENABLE = os.getenv("INGEST_ENABLE", "1").lower() in {"1", "true", "yes"}
INGEST_INTERVAL_SECONDS = int(os.getenv("INGEST_INTERVAL_SECONDS", "86400"))
INGEST_MAX_SCAN_AHEAD = int(os.getenv("INGEST_MAX_SCAN_AHEAD", "50"))
INGEST_MAX_CONSECUTIVE_MISSES = int(os.getenv("INGEST_MAX_CONSECUTIVE_MISSES", "20"))
INGEST_HANDLE_PREFIX = os.getenv("INGEST_HANDLE_PREFIX", "")
INGEST_STATUS_FILE = Path(
    os.getenv("INGEST_STATUS_FILE", PIPELINE_ROOT / "outputs/ingest_status.json")
)

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        }
    },
    "root": {
        "handlers": ["console"],
        "level": os.getenv("DJANGO_LOG_LEVEL", "INFO"),
    },
}
