# Code Patches - Apply These Changes

## Summary of Changes Required

This document provides the exact changes needed to remove hardcoded secrets from the codebase.

---

## 1. backend/app/core/security.py

**Current Location:** [backend/app/core/security.py](backend/app/core/security.py#L7)

### Required Changes:

```diff
  from datetime import datetime, timedelta
  from typing import Optional, Union
  from jose import JWTError, jwt
  from passlib.context import CryptContext

+ import os
+ import logging
+ 
+ logger = logging.getLogger(__name__)

  # Configuration
- SECRET_KEY = "***REMOVED***" # TODO: Load from env
+ SECRET_KEY = os.getenv("JWT_SECRET_KEY")
+ if not SECRET_KEY:
+     raise ValueError(
+         "CRITICAL: JWT_SECRET_KEY environment variable must be set. "
+         "Generate with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
+     )
+ 
+ if len(SECRET_KEY) < 32:
+     logger.warning("⚠️  JWT_SECRET_KEY is less than 32 characters - consider using a stronger key")

  ALGORITHM = "HS256"
  ACCESS_TOKEN_EXPIRE_MINUTES = 30
```

---

## 2. backend/app/config.py

**Current Location:** [backend/app/config.py](backend/app/config.py#L1-50)

### Required Changes:

```diff
  from pydantic_settings import BaseSettings
+ import os
+ import logging
+ from typing import Optional

+ logger = logging.getLogger(__name__)

  class Settings(BaseSettings):
      app_name: str = "Elite Governance Platform"
      env: str = "dev"
      api_host: str = "0.0.0.0"
      api_port: int = 8000
-     secret_key: str = "default_unsafe_secret"
+     secret_key: str = None  # Will be validated in __init__

      # --- INFRASTRUCTURE: REDIS ---
-     redis_url: str = "redis://localhost:6379/0"
+     redis_url: str = None  # Prefer .env

      # --- INFRASTRUCTURE: POSTGRES ---
-     database_url: str = "postgresql://admin:***REMOVED***@localhost:5432/gov_db"
+     database_url: str = None  # Must be set via environment

      # --- INFRASTRUCTURE: MINIO (Object Storage) ---
      minio_endpoint: str = "localhost:9000"
-     minio_access_key: str = "***REMOVED***"
-     minio_secret_key: str = "***REMOVED***"
+     minio_access_key: str = None  # Must be set via environment
+     minio_secret_key: str = None  # Must be set via environment
      minio_secure: bool = False  # Set to True for HTTPS

      # --- INFRASTRUCTURE: MEILISEARCH (Search Engine) ---
      meilisearch_host: str = "http://localhost:7700"
-     meilisearch_api_key: str = "***REMOVED***"
+     meilisearch_api_key: str = None  # Must be set via environment

      # --- WORKER: CELERY ---
      celery_broker_url: str = "redis://localhost:6379/0"
      celery_result_backend: str = "redis://localhost:6379/0"

      # --- AI MODELS ---
      sentiment_model_path: str = "j-hartmann/emotion-english-distilroberta-base"
      summarization_model_path: str = "facebook/bart-large-cnn"
-     gemini_api_key: str = ""  # Set via .env or environment variable
+     gemini_api_key: str = None  # Must be set via environment variable
      
      model_config = {
          "env_file": ".env",
          "env_file_encoding": "utf-8",
          "extra": "ignore",
          "populate_by_name": True,
      }

+     def __init__(self, **data):
+         super().__init__(**data)
+         self._validate_critical_settings()
+     
+     def _validate_critical_settings(self):
+         """Validate all critical settings are properly configured."""
+         required_settings = {
+             'database_url': 'postgresql:// format required',
+             'secret_key': '32+ character key required',
+             'minio_access_key': 'MinIO access key required',
+             'minio_secret_key': 'MinIO secret key required',
+             'meilisearch_api_key': 'Meilisearch API key required',
+         }
+         
+         for setting, desc in required_settings.items():
+             value = getattr(self, setting, None)
+             if not value:
+                 raise ValueError(
+                     f"CRITICAL: {setting.upper()} not set in environment.\n"
+                     f"Required: {desc}\n"
+                     f"Action: Set {setting.upper()} in .env or environment variables"
+                 )
+         
+         # Validate database URL format
+         if not self.database_url.startswith(('postgresql://', 'postgres://')):
+             raise ValueError(
+                 "CRITICAL: DATABASE_URL must use postgresql:// or postgres:// scheme\n"
+                 f"Found: {self.database_url[:50]}..."
+             )

  # Instantiate settings to be imported elsewhere
- settings = Settings()
+ try:
+     settings = Settings()
+ except ValueError as e:
+     logger.error(f"Configuration Error:\n{e}")
+     raise SystemExit(1) from e
```

---

## 3. backend/app/api/auth.py

**Current Location:** [backend/app/api/auth.py](backend/app/api/auth.py#L15-20)

### Required Changes:

```diff
  from fastapi import APIRouter, Depends, HTTPException, status
  from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
  from sqlalchemy.orm import Session
  from datetime import timedelta
  from app.db.database import get_db
  from app.models.user import User
  from app.core.security import create_access_token, get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES, verify_password
  from pydantic import BaseModel

  router = APIRouter(tags=["Authentication"])
  oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/v1/auth/login")

- # Hardcoded Admin Credentials
- ADMIN_USERNAME = "admin"
- ADMIN_PASSWORD = "***REMOVED***"
- 
- # Hardcoded Demo User
- DEMO_USERNAME = "demo"
- DEMO_PASSWORD = "***REMOVED***"

+ # REMOVED: Hardcoded credentials have been eliminated
+ # All authentication must use database with bcrypt hashing
+ import logging
+ logger = logging.getLogger(__name__)

  # ... rest of file ...

  @router.post("/login_for_access_token")
  def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
-     if form_data.username == ADMIN_USERNAME:
-         if form_data.password == ADMIN_PASSWORD:
-             access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
-             access_token = create_access_token(
-                 data={"sub": ADMIN_USERNAME, "role": "admin"},
-                 expires_delta=access_token_expires
-             )
-             return {"access_token": access_token, "token_type": "bearer"}
-     
-     if form_data.username == DEMO_USERNAME:
-         if form_data.password == DEMO_PASSWORD:
-             access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
-             access_token = create_access_token(
-                 data={"sub": DEMO_USERNAME, "role": "demo"},
-                 expires_delta=access_token_expires
-             )
-             return {"access_token": access_token, "token_type": "bearer"}

+     # Database-only authentication
+     user = db.query(User).filter(User.username == form_data.username).first()
+     
+     if not user:
+         logger.warning(f"Login attempt with non-existent user: {form_data.username}")
+         raise HTTPException(status_code=401, detail="Invalid credentials")
+     
+     if not verify_password(form_data.password, user.hashed_password):
+         logger.warning(f"Failed login attempt for user: {form_data.username}")
+         raise HTTPException(status_code=401, detail="Invalid credentials")
+     
+     if not user.is_active:
+         raise HTTPException(status_code=403, detail="User account is inactive")
+     
+     access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
+     access_token = create_access_token(
+         data={"sub": str(user.id), "role": user.role},
+         expires_delta=access_token_expires
+     )
+     
+     return {
+         "access_token": access_token,
+         "token_type": "bearer",
+         "user": {"id": user.id, "username": user.username, "role": user.role}
+     }
```

---

## 4. backend/app/services/extractor_engine.py

**Current Location:** [backend/app/services/extractor_engine.py](backend/app/services/extractor_engine.py#L17-27)

### Required Changes:

```diff
  import pandas as pd
  import json
  import io
  import requests
  import time
  import re
  import random
  from bs4 import BeautifulSoup
  import pdfplumber
  from google import genai
  import os
+ import logging
  from io import StringIO, BytesIO
  from urllib.parse import urljoin, urlparse
  from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

+ logger = logging.getLogger(__name__)

  # --- CONFIGURATION ---
- DEFAULT_API_KEY = "***REMOVED***" # Shared Key
+ # REMOVED: Hardcoded API key - use environment variable instead

  class EliteScraperEngine:
      """
      The '100/100' Dynamic Scraping Engine.
      Designed for longevity: Uses a fallback strategy of API -> CSS -> DOM -> AI.
      """
      
      def __init__(self, use_proxy=False, proxy_url=None):
-         api_key_val = os.getenv("GEMINI_API_KEY", DEFAULT_API_KEY)
+         api_key_val = os.getenv("GEMINI_API_KEY")
+         
+         if not api_key_val:
+             logger.error("GEMINI_API_KEY environment variable not set")
+             raise ValueError(
+                 "GEMINI_API_KEY environment variable is required. "
+                 "Get API key from: https://makersuite.google.com/app/apikey"
+             )
+         
+         # Basic format validation
+         if not api_key_val.startswith("AIza"):
+             logger.error(f"Invalid Gemini API key format: {api_key_val[:10]}...")
+             raise ValueError("Invalid GEMINI_API_KEY format")
+         
          self.client = genai.Client(api_key=api_key_val)
```

---

## 5. backend/app/services/news_scraper.py

**Current Location:** [backend/app/services/news_scraper.py](backend/app/services/news_scraper.py#L44-45)

### Required Changes:

```diff
+ import logging
  from app.config import settings

+ logger = logging.getLogger(__name__)

  # In the function that uses Gemini API:
  async def generate_news_with_gemini(context_str: str):
-     api_key = os.getenv("GEMINI_API_KEY", "***REMOVED***")
+     api_key = settings.gemini_api_key
+     
+     if not api_key:
+         logger.error("Gemini API key not configured")
+         raise ValueError("GEMINI_API_KEY not available in environment")
+     
      url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key={api_key}"
      # ... rest of function
```

---

## 6. backend/app/services/nexus_graph_engine.py

**Current Location:** [backend/app/services/nexus_graph_engine.py](backend/app/services/nexus_graph_engine.py#L13)

### Required Changes:

```diff
  import os
+ import logging

+ logger = logging.getLogger(__name__)

- NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "***REMOVED***")
+ NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD")
+ if not NEO4J_PASSWORD:
+     logger.error("NEO4J_PASSWORD not configured")
+     raise ValueError("NEO4J_PASSWORD environment variable is required")
```

---

## 7. frontend-citizen/src/context/ConstitutionContext.tsx

**Current Location:** [frontend-citizen/src/context/ConstitutionContext.tsx](frontend-citizen/src/context/ConstitutionContext.tsx#L67-83)

### Required Changes:

```diff
  // ❌ REMOVE: API key storage in localStorage
- const CONST_KEY_STORAGE = "const_admin_api_key";

- export const ConstitutionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
-     const [apiKey, setApiKey] = useState<string | null>(null);
-     
-     useEffect(() => {
-         const storedKey = localStorage.getItem(CONST_KEY_STORAGE);
-         if (storedKey) setApiKey(storedKey);
-     }, []);
-     
-     const setAdminApiKey = (key: string) => {
-         setApiKey(key);
-         localStorage.setItem(CONST_KEY_STORAGE, key);
-     };

+ // ✅ API keys must be handled server-side only
+ interface ConstitutionContextType {
+     analyzeWithAI: (text: string) => Promise<AnalysisResult>;
+     constitutionText: string;
+     setConstitutionText: (text: string) => void;
+ }

+ export const ConstitutionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
+     const [text, setText] = useState<string>(DEFAULT_TEXT);
+     
+     const analyzeWithAI = async (textToAnalyze: string): Promise<AnalysisResult> => {
+         // Backend handles API key - frontend never sees it
+         const response = await api.post('/v1/constitution/analyze', {
+             text: textToAnalyze
+         });
+         return response.data;
+     };
```

---

## 8. Parli_backend/parli_backend_project/settings.py

**Current Location:** [Parli_backend/parli_backend_project/settings.py](Parli_backend/parli_backend_project/settings.py#L73)

### Required Changes:

```diff
+ import os
+ import logging
+ 
+ logger = logging.getLogger(__name__)

  # See https://docs.djangoproject.com/en/6.0/howto/deployment/checklist/

  # SECURITY WARNING: keep the secret key used in production secret!
- SECRET_KEY = "***REMOVED***"
+ SECRET_KEY = os.getenv("DJANGO_SECRET_KEY")
+ if not SECRET_KEY:
+     raise ValueError(
+         "CRITICAL: DJANGO_SECRET_KEY environment variable not set. "
+         "Generate with: python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'"
+     )

  # SECURITY WARNING: don't run with debug turned on in production!
- DEBUG = True
+ DEBUG = os.getenv("DEBUG", "False").lower() == "true"

- ALLOWED_HOSTS = []
+ ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
+ 
+ # Security settings for production
+ if not DEBUG:
+     SECURE_SSL_REDIRECT = True
+     SESSION_COOKIE_SECURE = True
+     CSRF_COOKIE_SECURE = True
+     SECURE_HSTS_SECONDS = 31536000
+     SECURE_HSTS_INCLUDE_SUBDOMAINS = True
+     SECURE_HSTS_PRELOAD = True
```

---

## 9. Parli_backend/scrapers/views.py

**Current Location:** [Parli_backend/scrapers/views.py](Parli_backend/scrapers/views.py#L493)

### Required Changes:

```diff
  import requests
+ import os
+ import logging

+ logger = logging.getLogger(__name__)

  def scrape_rajya_sabha():
      url = "https://integration.rajyasabha.digital/api-ext/api/v1/attendance/memberattendance"
      params = {"session": "270"}
      auth_headers = headers.copy()
      
-     auth_headers["Authorization"] = "Bearer Y0hKaFltaGhkQzVyYVhKaGJn"
+     api_token = os.getenv("RAJYA_SABHA_API_TOKEN")
+     if not api_token:
+         logger.warning("RAJYA_SABHA_API_TOKEN not configured - scraping disabled")
+         return None
+     
+     auth_headers["Authorization"] = f"Bearer {api_token}"
```

---

## 10. docker-compose.yml

**Current Location:** [docker-compose.yml](docker-compose.yml#L1-170)

### Required Changes:

Replace hardcoded environment variables with .env loading:

```diff
  version: '3.8'
  services:
    app:
      build:
        context: .
        dockerfile: Dockerfile
      image: gov_api_base:latest
      container_name: gov_intelligence_api
      command: uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
      ports:
        - "8000:8000"
+     env_file:
+       - .env
      environment:
-       - DATABASE_URL=postgresql://admin:***REMOVED***@db:5432/gov_db
-       - MINIO_ACCESS_KEY=***REMOVED***
-       - MINIO_SECRET_KEY=***REMOVED***
-       - MEILISEARCH_API_KEY=***REMOVED***
+       - MINIO_ENDPOINT=minio:9000
+       - MEILISEARCH_HOST=http://meilisearch:7700
+       - REDIS_URL=redis://redis:6379/0
        - REDIS_URL=redis://redis:6379/0
        - MINIO_ENDPOINT=minio:9000
        - MEILISEARCH_HOST=http://meilisearch:7700

    # Apply similar changes to all other services that have hardcoded secrets
```

**Full .env file structure to use:**
```
# Created from .env.example
# All secrets loaded from this single source
DATABASE_URL=postgresql://admin:NEW_PASSWORD@db:5432/gov_db
JWT_SECRET_KEY=generated-secret-key
DJANGO_SECRET_KEY=generated-django-key
SECRET_KEY=generated-app-secret
MINIO_ACCESS_KEY=generated-key
MINIO_SECRET_KEY=generated-secret
MEILISEARCH_API_KEY=generated-key
NEO4J_PASSWORD=generated-password
POSTGRES_PASSWORD=generated-password
GEMINI_API_KEY=generated-api-key
```

---

## 11. extractor/universal_extractor.py

**Current Location:** [extractor/universal_extractor.py](extractor/universal_extractor.py#L561)

### Required Changes:

```diff
+ import logging
+ import os

+ logger = logging.getLogger(__name__)

  if __name__ == "__main__":
      with st.sidebar:
          st.subheader("⚙️ Configuration")
          
          if st.session_state.get('is_admin', False):
-             api_key = st.text_input("Gemini API Key", value="***REMOVED***", type="password")
+             api_key = st.text_input(
+                 "Gemini API Key",
+                 value="",
+                 type="password",
+                 help="Configure GEMINI_API_KEY environment variable instead of entering here"
+             )
+             
+             # Prefer environment variable
+             env_api_key = os.getenv("GEMINI_API_KEY")
+             if env_api_key and not api_key:
+                 api_key = env_api_key
```

---

## Applying All Changes

### Option 1: Manual Application
1. Open each file listed above
2. Apply the changes from the diff
3. Save each file
4. Test locally

### Option 2: Using Git (Recommended)
```bash
# Create a new branch for security fixes
git checkout -b security/remove-hardcoded-secrets

# Apply changes to each file
# ... (make the changes as shown above)

# Commit
git add -A
git commit -m "security: remove hardcoded secrets and use environment variables"

# Verify no secrets remain
git diff HEAD~1 | grep -E "AIzaSy|***REMOVED***|***REMOVED***|***REMOVED***" || echo "✅ No secrets in changes"
```

---

## Verification Steps

After applying all patches:

```bash
# 1. Check for remaining hardcoded secrets
grep -r "***REMOVED***\|***REMOVED***\|***REMOVED***\|***REMOVED***" --include="*.py" --include="*.tsx" --include="*.yml" . || echo "✅ No secrets found"

# 2. Test configuration loading
cd backend
python -c "from app.config import settings; print('✅ Config loaded')" || echo "❌ Config error"

# 3. Start services with new .env
docker-compose down
docker-compose up -d
docker-compose ps

# 4. Verify APIs respond
curl http://localhost:8000/health
```

---

## Timeline

- Total file changes: 11 files
- Lines changed: ~200-300 lines
- Estimated time: 2-4 hours for complete application + testing
- Estimated time: 2-4 hours for complete application + testing

---

*This document should be used alongside REMEDIATION_PLAN.md and IMMEDIATE_ACTION_STEPS.md*
