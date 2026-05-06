import os

class Settings:
    PROJECT_NAME: str = "AI Document Intelligence Engine"
    API_V1_STR: str = "/api/v1"
    
    # Path to local storage
    STORAGE_DIR: str = os.path.join(os.getcwd(), "storage")
    
    # Ollama settings
    OLLAMA_MODEL: str = "llama3"

settings = Settings()
