# Security Remediation Plan - Code Changes

## Before/After Examples

### Fix 1: backend/app/core/security.py

**BEFORE (VULNERABLE):**
```python
# Configuration
SECRET_KEY = "***REMOVED***" # TODO: Load from env
ALGORITHM = "HS256"
```

**AFTER (SECURE):**
```python
import os
from typing import Optional

# Load from environment, fail if not set
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise ValueError(
        "CRITICAL: JWT_SECRET_KEY not set in environment. "
        "Generate with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
    )

if len(SECRET_KEY) < 32:
    raise ValueError("JWT_SECRET_KEY must be at least 32 characters")

ALGORITHM = "HS256"
```

---

### Fix 2: backend/app/config.py

**BEFORE (VULNERABLE):**
```python
class Settings(BaseSettings):
    secret_key: str = "default_unsafe_secret"
    database_url: str = "postgresql://admin:***REMOVED***@localhost:5432/gov_db"
    minio_access_key: str = "***REMOVED***"
    minio_secret_key: str = "***REMOVED***"
    meilisearch_api_key: str = "***REMOVED***"
    gemini_api_key: str = ""
```

**AFTER (SECURE):**
```python
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # --- SECURITY: CRITICAL VALIDATION ---
    secret_key: str = None  # Must be set via env
    
    # --- INFRASTRUCTURE ---
    database_url: str = None  # Must be set via env
    redis_url: str = None  # Must be set via env
    
    # --- STORAGE ---
    minio_endpoint: str
    minio_access_key: str = None  # Must be set via env
    minio_secret_key: str = None  # Must be set via env
    minio_secure: bool = True  # Always use HTTPS in production
    
    # --- SEARCH ---
    meilisearch_host: str
    meilisearch_api_key: str = None  # Must be set via env
    
    # --- AI/MODELS ---
    gemini_api_key: str = None  # Must be set via env
    
    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
        "populate_by_name": True,
    }

    def __init__(self, **data):
        super().__init__(**data)
        self._validate_secrets()
    
    def _validate_secrets(self):
        """Validate all critical secrets are set and have minimum length."""
        critical_fields = {
            'secret_key': 32,
            'database_url': 20,
            'minio_access_key': 3,
            'minio_secret_key': 8,
            'meilisearch_api_key': 10,
        }
        
        for field, min_len in critical_fields.items():
            value = getattr(self, field, None)
            if not value:
                raise ValueError(f"CRITICAL: {field.upper()} not set in environment")
            if len(str(value)) < min_len:
                raise ValueError(f"CRITICAL: {field.upper()} too short (minimum {min_len} chars)")
        
        # Database URL validation
        if not self.database_url.startswith(('postgresql://', 'postgres://')):
            raise ValueError("CRITICAL: DATABASE_URL must use postgresql:// scheme")

# Create settings instance with validation
try:
    settings = Settings()
except ValueError as e:
    print(f"Configuration Error: {e}")
    exit(1)
```

---

### Fix 3: backend/app/api/auth.py

**BEFORE (VULNERABLE):**
```python
# Hardcoded Admin Credentials
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "***REMOVED***"

# Hardcoded Demo User
DEMO_USERNAME = "demo"
DEMO_PASSWORD = "***REMOVED***"

@router.post("/login_for_access_token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    if form_data.username == ADMIN_USERNAME:
        if form_data.password == ADMIN_PASSWORD:
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": ADMIN_USERNAME, "role": "admin"},
                expires_delta=access_token_expires
            )
```

**AFTER (SECURE):**
```python
import os
from app.db.models import User
from app.core.security import verify_password

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Login endpoint - ONLY uses database authentication.
    Hardcoded credentials are DISABLED.
    """
    # Query user from database
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user:
        # Use generic error message to prevent user enumeration
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )
    
    # Verify password using bcrypt
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User account is disabled"
        )
    
    # Create JWT token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id, "username": user.username, "role": user.role},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role
        }
    }
```

---

### Fix 4: backend/app/services/extractor_engine.py

**BEFORE (VULNERABLE):**
```python
DEFAULT_API_KEY = "***REMOVED***" # Shared Key

class EliteScraperEngine:
    def __init__(self, use_proxy=False, proxy_url=None):
        api_key_val = os.getenv("GEMINI_API_KEY", DEFAULT_API_KEY)  # Falls back to hardcoded!
        self.client = genai.Client(api_key=api_key_val)
```

**AFTER (SECURE):**
```python
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class EliteScraperEngine:
    def __init__(self, use_proxy=False, proxy_url=None):
        # NEVER use a default API key
        api_key_val = os.getenv("GEMINI_API_KEY")
        
        if not api_key_val:
            logger.error("CRITICAL: GEMINI_API_KEY not found in environment")
            raise ValueError(
                "GEMINI_API_KEY environment variable is required. "
                "Obtain from: https://makersuite.google.com/app/apikey"
            )
        
        # Validate key format
        if not api_key_val.startswith("AIza"):
            logger.error("Invalid Gemini API key format")
            raise ValueError("Invalid GEMINI_API_KEY format")
        
        try:
            self.client = genai.Client(api_key=api_key_val)
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {e}")
            raise
```

---

### Fix 5: backend/app/services/news_scraper.py

**BEFORE (VULNERABLE):**
```python
api_key = os.getenv("GEMINI_API_KEY", "***REMOVED***")
url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key={api_key}"
```

**AFTER (SECURE):**
```python
import os
import logging
from urllib.parse import urlencode
from app.config import settings  # Use centralized config with validation

logger = logging.getLogger(__name__)

def get_gemini_url(prompt: str) -> str:
    """Generate Gemini API URL with validated API key."""
    api_key = settings.gemini_api_key  # Already validated in settings.__init__
    
    if not api_key:
        logger.error("Gemini API key not available")
        raise ValueError("GEMINI_API_KEY not configured")
    
    params = {
        "key": api_key
    }
    return f"https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?{urlencode(params)}"
```

---

### Fix 6: frontend-citizen/src/context/ConstitutionContext.tsx

**BEFORE (VULNERABLE - Stores API key in localStorage):**
```typescript
const CONST_KEY_STORAGE = "const_admin_api_key";

const setAdminApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem(CONST_KEY_STORAGE, key);  // VULNERABLE!
};

// Exposed in browser XSS attacks
```

**AFTER (SECURE - Never store API key in frontend):**
```typescript
// ❌ NEVER store secrets in frontend code or localStorage
// ✅ API calls must go through backend proxy

interface ConstitutionContextType {
    analyzeWithAI: (text: string) => Promise<AnalysisResult>;
    // API key is handled server-side only
}

export const ConstitutionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Remove localStorage API key storage
    
    const analyzeWithAI = async (text: string): Promise<AnalysisResult> => {
        // Call backend endpoint instead - backend handles API key securely
        const response = await api.post('/v1/constitution/analyze', {
            text: text
        });
        return response.data;
    };
    
    return (
        <ConstitutionContext.Provider value={{
            analyzeWithAI,
            // Don't expose API key to frontend
        }}>
            {children}
        </ConstitutionContext.Provider>
    );
};
```

---

### Fix 7: docker-compose.yml

**BEFORE (VULNERABLE - Hardcoded secrets):**
```yaml
environment:
  - DATABASE_URL=postgresql://admin:***REMOVED***@db:5432/gov_db
  - MINIO_ACCESS_KEY=***REMOVED***
  - MINIO_SECRET_KEY=***REMOVED***
  - MEILISEARCH_API_KEY=***REMOVED***
```

**AFTER (SECURE - Uses .env file):**
```yaml
# Load all secrets from .env file (gitignored)
env_file:
  - .env

# Override only non-sensitive defaults
environment:
  - MINIO_ENDPOINT=minio:9000
  - MEILISEARCH_HOST=http://meilisearch:7700
  - REDIS_URL=redis://redis:6379/0
```

**Create .env file (gitignored):**
```bash
# .env (DO NOT COMMIT - add to .gitignore)
DATABASE_URL=postgresql://new_admin:GENERATED_SECURE_PASSWORD_HERE@db:5432/gov_db
POSTGRES_USER=admin
POSTGRES_PASSWORD=GENERATED_SECURE_PASSWORD_HERE
NEO4J_AUTH=neo4j/GENERATED_SECURE_PASSWORD_HERE
MINIO_ACCESS_KEY=GENERATED_ACCESS_KEY_HERE
MINIO_SECRET_KEY=GENERATED_SECRET_KEY_HERE
MINIO_ROOT_USER=GENERATED_USER_HERE
MINIO_ROOT_PASSWORD=GENERATED_PASSWORD_HERE
MEILISEARCH_API_KEY=GENERATED_KEY_HERE
GEMINI_API_KEY=GENERATED_API_KEY_HERE
JWT_SECRET_KEY=GENERATED_SECRET_HERE
SECRET_KEY=GENERATED_SECRET_HERE
```

---

### Fix 8: Parli_backend/parli_backend_project/settings.py

**BEFORE (VULNERABLE):**
```python
SECRET_KEY = "***REMOVED***"
DEBUG = True
ALLOWED_HOSTS = []
```

**AFTER (SECURE):**
```python
import os
from pathlib import Path

# Load SECRET_KEY from environment
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY")
if not SECRET_KEY:
    raise ValueError(
        "CRITICAL: DJANGO_SECRET_KEY environment variable not set. "
        "Generate with: python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'"
    )

# Use environment for debug mode
DEBUG = os.getenv("DEBUG", "False").lower() == "true"

# Strict allowed hosts - NO wildcards
ALLOWED_HOSTS = [
    host.strip() 
    for host in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    if host.strip()
]

# Security headers for production
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
```

---

### Fix 9: Parli_backend/scrapers/views.py

**BEFORE (VULNERABLE - Hardcoded Bearer token):**
```python
auth_headers["Authorization"] = "Bearer Y0hKaFltaGhkQzVyYVhKaGJn"
```

**AFTER (SECURE - Load from environment):**
```python
import os
import logging

logger = logging.getLogger(__name__)

RAJYA_SABHA_API_TOKEN = os.getenv("RAJYA_SABHA_API_TOKEN")

if not RAJYA_SABHA_API_TOKEN:
    logger.warning("RAJYA_SABHA_API_TOKEN not configured - scraping disabled")
else:
    auth_headers["Authorization"] = f"Bearer {RAJYA_SABHA_API_TOKEN}"
```

---

## Generation of Secure Secrets

### Generate New Secrets

```bash
#!/bin/bash
# generate_secrets.sh

echo "Generating secure secrets for production deployment..."
echo ""

# Generate JWT Secret
echo "JWT_SECRET_KEY=$(python -c 'import secrets; print(secrets.token_urlsafe(32))')"

# Generate Django Secret  
echo "DJANGO_SECRET_KEY=$(python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')"

# Generate database password
echo "DB_PASSWORD=$(python -c 'import secrets; print(secrets.token_urlsafe(32))')"

# Generate MinIO credentials
echo "MINIO_ACCESS_KEY=$(python -c 'import secrets; print(secrets.token_urlsafe(16))')"
echo "MINIO_SECRET_KEY=$(python -c 'import secrets; print(secrets.token_urlsafe(32))')"

# Generate API keys
echo "MEILISEARCH_API_KEY=$(python -c 'import secrets; print(secrets.token_urlsafe(24))')"

echo ""
echo "Store these in backend/.env and .env files"
echo "NEVER commit .env files to git"
```

---

## .gitignore Updates

**BEFORE (INCOMPLETE):**
```
.env
.env.local
```

**AFTER (COMPREHENSIVE):**
```
# Environment variables - ALL must be gitignored
.env
.env.local
.env.*.local
.env.production
.env.staging
.env.development

# Secrets and credentials
secrets/
secrets.txt
credentials.json
*.key
*.pem

# Build outputs that may contain secrets
build/
dist/
frontend-citizen/buildv.txt
frontend-citizen/dist/

# IDE and system files
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Dependency caches (can be regenerated)
node_modules/
.pip-cache/
venv/
env/

# Logs
*.log
logs/

# Coverage reports
htmlcov/
.coverage
.pytest_cache/

# Database files
*.db
*.sqlite
*.sqlite3
postgres_data/
neo4j_data/
redis_data/

# Docker volumes
minio_data/
meilisearch_data/
```

---

## GitHub Security Actions

### 1. Enable GitHub Secret Scanning

```bash
# Go to repository Settings > Security & analysis
# Enable:
- Secret scanning
- Secret scanning push protection
- Dependabot alerts
- Dependabot security updates
```

### 2. Update GitHub Secrets (for CI/CD)

```bash
# Use GitHub CLI to set secrets securely
gh secret set JWT_SECRET_KEY --body "$(python -c 'import secrets; print(secrets.token_urlsafe(32))')"
gh secret set DJANGO_SECRET_KEY --body "$(python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')"
gh secret set DATABASE_PASSWORD --body "$(python -c 'import secrets; print(secrets.token_urlsafe(32))')"
```

### 3. Create a .github/workflows/security-scan.yml

```yaml
name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  secret-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: TruffleHog Secret Scanning
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
          extra_args: --debug
      
      - name: Gitleaks Scanning
        uses: gitleaks/gitleaks-action@v2
```

---

## Monitoring & Prevention

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Prevent committing files with secrets
echo "Running secret scan..."

# Check for common secret patterns
patterns=(
    "AIzaSy[A-Za-z0-9_-]{35}"  # Gemini API keys
    "sk-[A-Za-z0-9]{48}"        # OpenAI keys
    "django-insecure-"           # Django secrets
    "***REMOVED***"                 # MinIO default creds
    "***REMOVED***"             # Weak passwords
)

for pattern in "${patterns[@]}"; do
    if git diff --cached | grep -E "$pattern" > /dev/null; then
        echo "❌ ERROR: Potential secret detected matching pattern: $pattern"
        echo "Commit blocked. Please remove the secret and use environment variables."
        exit 1
    fi
done

echo "✅ Secret scan passed"
exit 0
```

Install with:
```bash
chmod +x .git/hooks/pre-commit
```

---

## Complete Environment File Template

**backend/.env.example (TEMPLATE - NO SECRETS):**
```bash
# Application Settings
ENV=production
API_PORT=8000

# Security - CHANGE THESE IN PRODUCTION
SECRET_KEY=your-super-secret-key-min-32-chars
JWT_SECRET_KEY=your-jwt-secret-min-32-chars
DJANGO_SECRET_KEY=your-django-secret

# Database - PostgreSQL
DATABASE_URL=postgresql://admin:PASSWORD@localhost:5432/gov_db

# Redis
REDIS_URL=redis://localhost:6379/0

# MinIO (Object Storage)
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=***REMOVED***
MINIO_SECRET_KEY=***REMOVED***
MINIO_SECURE=false  # Set to true for HTTPS

# Meilisearch
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=***REMOVED***

# Neo4j
NEO4J_PASSWORD=***REMOVED***

# AI/Models
GEMINI_API_KEY=your-api-key-here  # Get from https://makersuite.google.com/app/apikey

# External APIs
RAJYA_SABHA_API_TOKEN=your-token-here

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
```

---

## Action Checklist

### Immediate (24 hours)
- [ ] Rotate ALL API keys (Gemini, MinIO, Meilisearch)
- [ ] Change ALL database passwords (PostgreSQL, Neo4j)
- [ ] Disable hardcoded admin credentials
- [ ] Create .env files with new secrets
- [ ] Update .gitignore with comprehensive patterns
- [ ] Delete exposed secrets from git history (BFG)
- [ ] Force push cleaned repository

### Short-term (1 week)
- [ ] Audit git log for other exposed secrets
- [ ] Implement environment-based config across all services
- [ ] Add validation for all secrets at startup
- [ ] Set up GitHub Secret Scanning
- [ ] Implement pre-commit hooks
- [ ] Add security scanning to CI/CD
- [ ] Review and rotate any old passwords

### Long-term (Ongoing)
- [ ] Implement secret manager (AWS Secrets Manager, HashiCorp Vault, etc.)
- [ ] Enable audit logging for all secret access
- [ ] Regular penetration testing
- [ ] Security training for development team
- [ ] Implement RBAC for secret access
- [ ] Automated secret rotation policies
- [ ] Monitor GitHub for re-exposure of old secrets

---

## References

- [OWASP Secrets Management](https://owasp.org/www-project-web-security-testing-guide/stable/4-Web_Application_Security_Testing/06-Session_Management_Testing/04-Testing_for_Insecure_Session_Management)
- [CWE-798: Use of Hard-Coded Credentials](https://cwe.mitre.org/data/definitions/798.html)
- [CWE-798: Use of Hard-Coded Credentials](https://cwe.mitre.org/data/definitions/798.html)
- [Google Cloud API Key Security](https://cloud.google.com/docs/authentication/api-keys)
- [Django SECRET_KEY Guide](https://docs.djangoproject.com/en/stable/ref/settings/#secret-key)
- [12 Factor App - Config](https://12factor.net/config)

---

## Emergency Contacts

**If you suspect active exploitation:**
1. Immediately rotate ALL secrets
2. Check logs for unauthorized access
3. Contact your infrastructure team
4. File incident report with security team
5. Review audit logs for compromise indicators

---

**Report prepared by:** Security Review Agent
**Date:** May 7, 2026
**Severity:** CRITICAL
**Status:** ACTION REQUIRED IMMEDIATELY
