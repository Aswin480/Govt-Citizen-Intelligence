# IMMEDIATE ACTION PLAN - Execute in Order

## Phase 1: Immediate Containment (Next 2 Hours)

### Step 1: Backup Current Configuration
```bash
# Create backup of current sensitive files before changes
cd d:\Users\rcnai\Desktop\pro.org.1
mkdir -p _backups
cp backend/app/config.py _backups/config.py.backup.$(date +%s)
cp backend/app/core/security.py _backups/security.py.backup.$(date +%s)
cp docker-compose.yml _backups/docker-compose.yml.backup.$(date +%s)
```

### Step 2: Stop All Services
```bash
# Stop all running containers
docker-compose down

# Verify all containers are stopped
docker ps
```

### Step 3: Generate New Secure Secrets

**Option A: Python (Recommended)**
```python
import secrets
import json
from datetime import datetime

secrets_dict = {
    "generated_at": datetime.now().isoformat(),
    "JWT_SECRET_KEY": secrets.token_urlsafe(32),
    "DJANGO_SECRET_KEY": secrets.token_urlsafe(48),
    "DB_PASSWORD": secrets.token_urlsafe(32),
    "NEO4J_PASSWORD": secrets.token_urlsafe(32),
    "MINIO_ACCESS_KEY": secrets.token_urlsafe(16),
    "MINIO_SECRET_KEY": secrets.token_urlsafe(32),
    "MINIO_ROOT_PASSWORD": secrets.token_urlsafe(32),
    "MEILISEARCH_API_KEY": secrets.token_urlsafe(24),
}

with open("_new_secrets.json", "w") as f:
    json.dump(secrets_dict, f, indent=2)

print("✅ New secrets generated and saved to _new_secrets.json")
```

**Option B: Bash Script**
```bash
#!/bin/bash
# generate_new_secrets.sh

cat > .env << 'EOF'
# Generated: $(date)
JWT_SECRET_KEY=$(python -c 'import secrets; print(secrets.token_urlsafe(32))')
DJANGO_SECRET_KEY=$(python -c 'import secrets; print(secrets.token_urlsafe(48))')
DB_PASSWORD=$(python -c 'import secrets; print(secrets.token_urlsafe(32))')
NEO4J_PASSWORD=$(python -c 'import secrets; print(secrets.token_urlsafe(32))')
MINIO_ACCESS_KEY=$(python -c 'import secrets; print(secrets.token_urlsafe(16))')
MINIO_SECRET_KEY=$(python -c 'import secrets; print(secrets.token_urlsafe(32))')
MINIO_ROOT_PASSWORD=$(python -c 'import secrets; print(secrets.token_urlsafe(32))')
MEILISEARCH_API_KEY=$(python -c 'import secrets; print(secrets.token_urlsafe(24))')
GEMINI_API_KEY=your-new-key-from-google-cloud
RAJYA_SABHA_API_TOKEN=your-new-token
EOF

chmod 600 .env
echo "✅ .env file created with new secrets"
```

### Step 4: Create Temporary .env File (Immediate)

```bash
cd d:\Users\rcnai\Desktop\pro.org.1

# Create backend/.env with minimal new secrets
cat > backend/.env << 'EOF'
# ⚠️ TEMPORARY - GENERATED $(date)
# This file will be replaced after secret rotation

ENV=production
DEBUG=False

# New secrets generated - store these safely!
JWT_SECRET_KEY=PLACEHOLDER_JWT_SECRET_KEY_CHANGE_ME
DJANGO_SECRET_KEY=PLACEHOLDER_DJANGO_SECRET_CHANGE_ME
SECRET_KEY=PLACEHOLDER_APP_SECRET_CHANGE_ME

# Database with NEW password
DATABASE_URL=postgresql://admin:PLACEHOLDER_NEW_DB_PASSWORD@localhost:5432/gov_db

# Redis
REDIS_URL=redis://localhost:6379/0

# MinIO with NEW credentials
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=PLACEHOLDER_NEW_MINIO_KEY
MINIO_SECRET_KEY=PLACEHOLDER_NEW_MINIO_SECRET
MINIO_SECURE=false

# Meilisearch
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=PLACEHOLDER_NEW_MEILI_KEY

# Neo4j
NEO4J_PASSWORD=PLACEHOLDER_NEW_NEO4J_PASSWORD

# AI Models - Get NEW API key from Google Cloud
GEMINI_API_KEY=PLACEHOLDER_NEW_GEMINI_API_KEY

# External APIs - Get NEW token
RAJYA_SABHA_API_TOKEN=PLACEHOLDER_NEW_TOKEN
EOF

chmod 600 backend/.env
echo "✅ backend/.env created"
```

### Step 5: Remove Secrets from Code (Immediate - Temporary Disable)

These will be properly fixed later with environment variables.

#### Remove from backend/app/api/auth.py
Comment out hardcoded credentials:

```python
# DISABLED: Hardcoded credentials have been removed
# Use database authentication only via backend/.env
# ADMIN_USERNAME = "admin"
# ADMIN_PASSWORD = "***REMOVED***"
# DEMO_USERNAME = "demo"
# DEMO_PASSWORD = "***REMOVED***"

# All authentication must go through the database with proper hashing
```

#### Remove from backend/app/services/extractor_engine.py
```python
# REMOVED: Hardcoded API key
# DEFAULT_API_KEY = "***REMOVED***"

# Must use environment variable
from app.config import settings

class EliteScraperEngine:
    def __init__(self, use_proxy=False, proxy_url=None):
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY environment variable required")
        self.client = genai.Client(api_key=settings.gemini_api_key)
```

---

## Phase 2: Git History Cleanup (Next 1 Hour)

### Step 1: Install BFG Repo-Cleaner
```bash
# Windows - using chocolatey
choco install bfg

# macOS - using brew
brew install bfg

# Linux - download binary
wget https://repo.1password.com/dist/bfg/bfg-1.13.2.jar
```

### Step 2: Create Credentials File for BFG
```bash
# Create file with patterns to replace
cat > credentials.txt << 'EOF'
***REMOVED***
AIzaSyAFyCDKzDdRqlSX2uGl2JJQW_FNIzNZrx8
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
Y0hKaFltaGhkQzVyYVhKaGJn
***REMOVED***
default_unsafe_secret
EOF
```

### Step 3: Clean Git History
```bash
# Clone a fresh copy for cleaning (safe approach)
cd ..
git clone --mirror d:\Users\rcnai\Desktop\pro.org.1 pro.org.1.git

# Run BFG
cd pro.org.1.git
bfg --replace-text credentials.txt

# Reflog cleanup
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Push cleaned history (CAREFUL - this is forced push)
cd ../pro.org.1
git push origin --force --all
git push origin --force --tags
```

### Step 4: Verify Cleanup
```bash
# Verify secrets are no longer in history
git log --all -p | grep -i "***REMOVED***" || echo "✅ Secret not found in history"
git log --all -p | grep -i "***REMOVED***" || echo "✅ Credential not found in history"
```

---

## Phase 3: Update .gitignore (Immediate)

Replace [.gitignore](.gitignore) with:

```
# Environment Variables - CRITICAL
.env
.env.local
.env.*.local
.env.production.local
.env.development.local
.env.*.example
backend/.env
frontend-citizen/.env
backend_nlp/.env
Parli_backend/.env

# Secrets Management
secrets.json
_new_secrets.json
_backups/
*.key
*.pem
*.pfx
credentials.txt

# Build Outputs (may contain secrets)
frontend-citizen/buildv.txt
frontend-citizen/dist
backend/dist

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Python
__pycache__/
*.pyc
*.pyo
venv/
env/
.pip-cache/

# Node
node_modules/
.pnpm-debug.log

# Logs
*.log
logs/

# Testing
.pytest_cache/
htmlcov/
.coverage

# Docker Volumes
postgres_data/
neo4j_data/
redis_data/
minio_data/
meilisearch_data/

# OS Files
Thumbs.db
.DS_Store
```

Then:
```bash
# Remove accidentally committed .env files from git tracking (but keep locally)
git rm --cached backend/.env
git rm --cached frontend-citizen/.env 2>/dev/null || true
git rm --cached docker-compose.override.yml 2>/dev/null || true
git commit -m "chore: remove tracked .env files and add to .gitignore"
git push origin main
```

---

## Phase 4: Restore Secrets in Git History (Final Safety)

### Step 1: Invalidate Old Secrets Immediately

**For each secret type, immediately invalidate:**

#### PostgreSQL
```sql
-- Connect as admin
ALTER USER admin WITH PASSWORD 'NEW_SECURE_PASSWORD_32_CHARS_MINIMUM';

-- Verify change
SELECT usename, valuntil FROM pg_user;
```

#### Neo4j
```cypher
// In Neo4j browser
:param newPassword => 'NEW_SECURE_PASSWORD_32_CHARS_MINIMUM'

ALTER USER neo4j SET PASSWORD $newPassword;
```

#### MinIO
```bash
# Access MinIO console at http://localhost:9001
# Settings > Users > ***REMOVED*** > Change Password
# Or via CLI:
mc admin user change play ***REMOVED*** NEWPASSWORD
```

#### Meilisearch
```bash
# Stop service
docker-compose down

# Update docker-compose.yml or .env with new key

# Restart
docker-compose up -d
```

#### Google Gemini API
```bash
# Go to https://console.cloud.google.com/apis/credentials
# Delete old key: ***REMOVED***
# Delete old key: AIzaSyAFyCDKzDdRqlSX2uGl2JJQW_FNIzNZrx8
# Create new key
# Add to backend/.env as GEMINI_API_KEY
```

### Step 2: Audit Logs for Unauthorized Access

```bash
# Check PostgreSQL logs
tail -100 /var/log/postgresql/postgresql.log | grep "FAILED\|ERROR"

# Check application logs for suspicious activity
grep -r "401\|403\|Unauthorized" logs/ | tail -20

# Check for API abuse (Gemini)
# Go to Google Cloud Console > Quotas & System Limits
# Look for unusual spike in API usage
```

### Step 3: Verify No Secrets in Git History After Cleanup

```bash
# Search for any remaining secrets
patterns=(
    "AIzaSy"
    "django-insecure"
    "***REMOVED***"
    "***REMOVED***"
    "***REMOVED***"
    "***REMOVED***"
    "***REMOVED***"
)

echo "Scanning git history for secrets..."
for pattern in "${patterns[@]}"; do
    count=$(git log --all -p | grep -i "$pattern" | wc -l)
    if [ $count -gt 0 ]; then
        echo "❌ WARNING: Found $count instances of pattern '$pattern'"
    fi
done

echo "✅ Scan complete"
```

---

## Phase 5: Implement Environment-Based Config

### Step 1: Backend Configuration
Apply changes from REMEDIATION_PLAN.md:
- Update `backend/app/core/security.py`
- Update `backend/app/config.py`
- Update `backend/app/api/auth.py`
- Update `backend/app/services/extractor_engine.py`
- Update `backend/app/services/news_scraper.py`

### Step 2: Frontend Configuration
Apply changes from REMEDIATION_PLAN.md:
- Update `frontend-citizen/src/context/ConstitutionContext.tsx`
- Remove API key storage from localStorage
- Implement backend proxy for API calls

### Step 3: Django Configuration
Apply changes from REMEDIATION_PLAN.md:
- Update `Parli_backend/parli_backend_project/settings.py`
- Update `Parli_backend/scrapers/views.py`

### Step 4: Docker Configuration
Update `docker-compose.yml`:
```yaml
services:
  app:
    env_file:
      - .env
    environment:
      - LOG_LEVEL=info
      # No secrets hardcoded!
```

---

## Phase 6: Testing & Verification

### Test 1: Verify Secrets Load from Environment
```bash
# Start backend
cd backend
python -c "from app.config import settings; print('✅ Config loaded successfully')"

# Should NOT error about missing secrets
```

### Test 2: Verify API Key Works
```bash
# Test Gemini API
python -c "
from app.services.extractor_engine import EliteScraperEngine
try:
    engine = EliteScraperEngine()
    print('✅ Gemini API initialized')
except Exception as e:
    print(f'❌ Error: {e}')
"
```

### Test 3: Verify Database Connection
```bash
# Test PostgreSQL
python -c "
from app.db.database import engine
with engine.connect() as conn:
    result = conn.execute('SELECT 1')
    print('✅ PostgreSQL connected')
"
```

### Test 4: Start Services
```bash
# Start docker containers
docker-compose up -d

# Verify services are healthy
docker-compose ps
# All should be 'Up'

# Test backend API
curl http://localhost:8000/health

# Test frontend
curl http://localhost:3000
```

---

## Phase 7: GitHub Security Configuration

### Step 1: Enable Secret Scanning
```bash
# Go to GitHub repository
# Settings > Security & analysis > Secret scanning
# Toggle ON: "Alert on push" 
# Toggle ON: "Push protection"
```

### Step 2: Add GitHub Actions Security Scan

Create `.github/workflows/secret-scan.yml`:

```yaml
name: Secret Scanning

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  secrets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Full history for scanning
      
      - name: TruffleHog
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          head: HEAD
```

### Step 3: Add Pre-commit Hooks

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
echo "🔒 Running secret scan..."

# Patterns to detect
patterns=(
    "AIzaSy[A-Za-z0-9_-]{35}"  # Gemini
    "sk-[A-Za-z0-9]{48}"        # OpenAI
    "django-insecure"           # Django
    "***REMOVED***"                # MinIO default
    "***REMOVED***\|***REMOVED***"         # Default creds
)

failed=0
for pattern in "${patterns[@]}"; do
    if git diff --cached | grep -E "$pattern" > /dev/null; then
        echo "❌ Potential secret detected: $pattern"
        failed=1
    fi
done

if [ $failed -eq 1 ]; then
    echo "❌ Commit rejected. Remove secrets before committing."
    exit 1
fi

echo "✅ Secret scan passed"
exit 0
```

Then:
```bash
chmod +x .git/hooks/pre-commit
```

---

## Final Verification Checklist

- [ ] All docker containers stopped
- [ ] New secrets generated and stored safely
- [ ] backend/.env created with new secrets
- [ ] Hardcoded credentials disabled in code
- [ ] .gitignore updated
- [ ] Git history cleaned with BFG
- [ ] Old secrets invalidated in all systems
- [ ] Environment-based config implemented
- [ ] Tests pass
- [ ] Services start successfully
- [ ] GitHub secret scanning enabled
- [ ] Pre-commit hooks installed
- [ ] Team notified of changes
- [ ] Audit logs reviewed for unauthorized access

---

## Rollback Procedure (If Needed)

```bash
# If something breaks, restore from backup
cp _backups/config.py.backup.* backend/app/config.py
cp _backups/docker-compose.yml.backup.* docker-compose.yml

# Use git history if cleanup failed
git revert <commit>

# Restart services
docker-compose down
docker-compose up -d
```

---

## Communication Template

**To: Development Team**

Subject: 🚨 CRITICAL SECURITY UPDATE - Immediate Action Required

The security audit identified **hardcoded secrets in GitHub**. These must be remediated immediately:

1. **Do NOT** clone or use any existing Docker images containing old code
2. **Pull latest** after cleanup is complete
3. **Update .env** files with new secrets from secure channel
4. **Test locally** before pushing any changes
5. **Report** any suspicious activity

All old secrets have been invalidated. New secrets are being distributed separately.

---

## Timeline Summary

| Phase | Task | Duration | Deadline |
|-------|------|----------|----------|
| 1 | Containment & Backup | 30 min | NOW |
| 2 | Git Cleanup | 30 min | 1 hour |
| 3 | .gitignore & Verification | 15 min | 1.5 hours |
| 4 | Secret Rotation | 1 hour | 2.5 hours |
| 5 | Code Updates | 2 hours | 4.5 hours |
| 6 | Testing | 1 hour | 5.5 hours |
| 7 | GitHub Config | 30 min | 6 hours |
| **TOTAL** | | **6 hours** | **ASAP** |

---

**Last Updated:** May 7, 2026
**Status:** CRITICAL - EXECUTE IMMEDIATELY
**Owner:** Security Team
