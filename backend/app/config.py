from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Elite Governance Platform"
    env: str = "dev"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    secret_key: str = "default_unsafe_secret"

    # --- INFRASTRUCTURE: REDIS ---
    redis_url: str = "redis://localhost:6379/0"

    # --- INFRASTRUCTURE: POSTGRES ---
    database_url: str = "postgresql://admin:***REMOVED***@localhost:5432/gov_db"

    # --- INFRASTRUCTURE: MINIO (Object Storage) ---
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "***REMOVED***"
    minio_secret_key: str = "***REMOVED***"
    minio_secure: bool = False  # Set to True for HTTPS

    # --- INFRASTRUCTURE: MEILISEARCH (Search Engine) ---
    meilisearch_host: str = "http://localhost:7700"
    meilisearch_api_key: str = "***REMOVED***"

    # --- WORKER: CELERY ---
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/0"

    # --- AI MODELS ---
    sentiment_model_path: str = "j-hartmann/emotion-english-distilroberta-base"
    summarization_model_path: str = "facebook/bart-large-cnn"
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
        "populate_by_name": True,
    }

# Instantiate settings to be imported elsewhere
settings = Settings()
