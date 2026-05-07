# 🚨 CRITICAL SECURITY AUDIT REPORT
## Exposed Secrets & Hardcoded Credentials in GitHub

**Report Date:** May 7, 2026  
**Severity:** CRITICAL - All identified secrets are exposed on GitHub  
**Status:** ACTION REQUIRED IMMEDIATELY  

---

## Executive Summary

This repository contains **CRITICAL security vulnerabilities** with hardcoded secrets exposed in:
- Source code files (Python, TypeScript/JavaScript)
- Configuration files (docker-compose.yml, settings.py, config.py)
- Build output files (buildv.txt)

These secrets can be used to:
- Access production databases and systems
- Hijack API quotas (Gemini API)
- Impersonate admin users
- Access cloud storage (MinIO)
- Decrypt JWT tokens
- Compromise user authentication

**Impact:** HIGH - All identified secrets are usable by unauthorized parties and have likely been indexed by GitHub's search and crawlers.

---

## INVENTORY OF EXPOSED SECRETS

### 1. 🔴 CRITICAL: Gemini API Key (Multiple Locations)

**Secret Value:** `***REMOVED***`

**Locations:**
- [backend/app/services/extractor_engine.py](backend/app/services/extractor_engine.py#L17)
  - Line 17: `DEFAULT_API_KEY = "***REMOVED***"  # Shared Key`
- [backend/app/services/news_scraper.py](backend/app/services/news_scraper.py#L44)
  - Line 44: `api_key = os.getenv("GEMINI_API_KEY", "***REMOVED***")`
- [backend/app/api/budget.py](backend/app/api/budget.py#L126)
  - Line 126: `api_key = os.getenv("GEMINI_API_KEY", "***REMOVED***")`
  - Line 175: `api_key = os.getenv("GEMINI_API_KEY", "***REMOVED***")`
- [extractor/universal_extractor.py](extractor/universal_extractor.py#L561)
  - Line 561: `api_key = st.text_input("Gemini API Key", value="***REMOVED***", type="password")`

**Risk Level:** 🔴 **CRITICAL**

**Impact:**
- Unauthorized API calls to Google Gemini models
- API quota exhaustion (costs billing to real account)
- Rate limiting attacks
- Content generation with shared credentials
- Potential denial of service on the legitimate account

**Secondary Exposure:**
- [frontend-citizen/buildv.txt](frontend-citizen/buildv.txt#L153)
  - Contains: `VITE_GEMINI_API_KEY: 'AIzaSyAFyCDKzDdRqlSX2uGl2JJQW_FNIzNZrx8'`
  - This is a DIFFERENT API key, also exposed

**Remediation:** ✅ See Action Plan

---

### 2. 🔴 CRITICAL: Django SECRET_KEY (Django Project)

**Secret Value:** `***REMOVED***`

**Location:**
- [Parli_backend/parli_backend_project/settings.py](Parli_backend/parli_backend_project/settings.py#L73)
  - Line 73: `SECRET_KEY = "***REMOVED***"`

**Risk Level:** 🔴 **CRITICAL**

**Impact:**
- Session forgery
- CSRF token forgery
- Cookie tampering
- Admin session hijacking
- User authentication bypass

**Remediation:** ✅ See Action Plan

---

### 3. 🔴 CRITICAL: FastAPI JWT SECRET_KEY

**Secret Value:** `***REMOVED***`

**Location:**
- [backend/app/core/security.py](backend/app/core/security.py#L7)
  - Line 7: `SECRET_KEY = "***REMOVED***" # TODO: Load from env`

**Risk Level:** 🔴 **CRITICAL**

**Impact:**
- JWT token forgery
- Admin impersonation
- Authentication bypass
- User session hijacking
- Authorization bypass

**Note:** The comment itself indicates this was intended to be changed - developer awareness indicates negligence.

**Remediation:** ✅ See Action Plan

---

### 4. 🔴 CRITICAL: Database Credentials (Multiple Locations)

**Secret Values:** 
- Username: `admin`
- Password: `***REMOVED***`
- Connection String: `postgresql://admin:***REMOVED***@localhost:5432/gov_db`

**Locations:**
- [docker-compose.yml](docker-compose.yml) - Multiple instances:
  - Line 14: `DATABASE_URL=postgresql://admin:***REMOVED***@db:5432/gov_db`
  - Line 36: `DATABASE_URL=postgresql://admin:***REMOVED***@db:5432/gov_db`
  - Line 56: `DATABASE_URL=postgresql://admin:***REMOVED***@db:5432/gov_db`
  - Line 76: `POSTGRES_PASSWORD: ***REMOVED***`
  - Line 143: `DATABASE_URL=postgresql://admin:***REMOVED***@db:5432/gov_db`
  - Line 158: `DATABASE_URL=postgresql://admin:***REMOVED***@db:5432/gov_db`
- [backend/app/config.py](backend/app/config.py#L14)
  - Line 14: `database_url: str = "postgresql://admin:***REMOVED***@localhost:5432/gov_db"`

**Risk Level:** 🔴 **CRITICAL**

**Impact:**
- Full database access (read/write/delete)
- Data exfiltration
- Data manipulation
- Data destruction
- SQL injection possible through connected applications
- Access to all government policy data

**Remediation:** ✅ See Action Plan

---

### 5. 🔴 CRITICAL: Neo4j Database Credentials

**Secret Values:**
- Username: `neo4j`
- Password: `***REMOVED***`

**Location:**
- [docker-compose.yml](docker-compose.yml#L89)
  - Line 89: `NEO4J_AUTH=neo4j/***REMOVED***`
- [backend/app/services/nexus_graph_engine.py](backend/app/services/nexus_graph_engine.py#L13)
  - Line 13: `NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "***REMOVED***")`

**Risk Level:** 🔴 **CRITICAL**

**Impact:**
- Graph database compromise
- Relationship data access
- Political network data access
- Data tampering
- Cypher injection possible

**Remediation:** ✅ See Action Plan

---

### 6. 🔴 CRITICAL: MinIO (Object Storage) Credentials

**Secret Values:**
- Access Key: `***REMOVED***`
- Secret Key: `***REMOVED***`
- Root User: `***REMOVED***`
- Root Password: `***REMOVED***`

**Locations:**
- [docker-compose.yml](docker-compose.yml) - Multiple instances:
  - Line 17-18: Both `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY`
  - Line 39-40: Repeated
  - Line 59-60: Repeated
  - Line 114-115: Root credentials
- [backend/app/config.py](backend/app/config.py#L18-L19)
  - Line 18: `minio_access_key: str = "***REMOVED***"`
  - Line 19: `minio_secret_key: str = "***REMOVED***"`

**Risk Level:** 🔴 **CRITICAL**

**Impact:**
- Full object storage access
- File upload/download/delete
- Bucket enumeration
- PII and documents access
- Service disruption

**Remediation:** ✅ See Action Plan

---

### 7. 🟠 HIGH: Meilisearch API Key

**Secret Value:** `***REMOVED***`

**Locations:**
- [docker-compose.yml](docker-compose.yml#L20)
  - Line 20: `MEILISEARCH_API_KEY=***REMOVED***`
- [backend/app/config.py](backend/app/config.py#L24)
  - Line 24: `meilisearch_api_key: str = "***REMOVED***"`

**Risk Level:** 🟠 **HIGH**

**Impact:**
- Search index manipulation
- Query injection
- Data reindexing attacks
- Service disruption

**Remediation:** ✅ See Action Plan

---

### 8. 🔴 CRITICAL: Hardcoded Admin Credentials

**Location:** [backend/app/api/auth.py](backend/app/api/auth.py#L15-L20)

**Credentials:**
- Admin Username: `admin`
- Admin Password: `***REMOVED***`
- Demo Username: `demo`
- Demo Password: `***REMOVED***`

```python
ADMIN_USERNAME = "admin"        # Line 15
ADMIN_PASSWORD = "***REMOVED***"     # Line 16
DEMO_USERNAME = "demo"          # Line 19
DEMO_PASSWORD = "***REMOVED***"       # Line 20
```

**Risk Level:** 🔴 **CRITICAL**

**Impact:**
- Direct admin login without database
- Full admin access to backend
- User management compromise
- Content manipulation
- All backend functionality access

**Remediation:** ✅ See Action Plan

---

### 9. 🔴 CRITICAL: Backend SECRET_KEY (Default Unsafe)

**Secret Value:** `default_unsafe_secret`

**Location:** [backend/app/config.py](backend/app/config.py#L8)
- Line 8: `secret_key: str = "default_unsafe_secret"`

**Risk Level:** 🔴 **CRITICAL**

**Impact:**
- If used anywhere, complete authentication compromise
- Token forgery potential

**Remediation:** ✅ See Action Plan

---

### 10. 🟠 HIGH: Bearer Token in Django

**Secret Value:** `Y0hKaFltaGhkQzVyYVhKaGJn` (Base64 encoded)

**Location:** [Parli_backend/scrapers/views.py](Parli_backend/scrapers/views.py#L493)
- Line 493: `auth_headers["Authorization"] = "Bearer Y0hKaFltaGhkQzVyYVhKaGJn"`

**Decoded Value:** `PfLyYmhkC5raXJhbg==` (still encoded or garbage - needs investigation)

**Risk Level:** 🟠 **HIGH**

**Impact:**
- Rajya Sabha API unauthorized access
- Scraped data manipulation
- Rate limiting bypass

**Remediation:** ✅ See Action Plan

---

### 11. 🟠 HIGH: Frontend API Key in localStorage

**Location:** [frontend-citizen/src/context/ConstitutionContext.tsx](frontend-citizen/src/context/ConstitutionContext.tsx#L77-L83)

**Issue:** API key stored in browser localStorage without encryption

```typescript
const storedKey = localStorage.getItem(CONST_KEY_STORAGE);  // Line 77
localStorage.setItem(CONST_KEY_STORAGE, key);               // Line 82
```

**Risk Level:** 🟠 **HIGH**

**Impact:**
- XSS attacks can steal API key
- Browser developer tools exposure
- Browser history exposure
- Unauthorized API usage from user's browser

**Remediation:** ✅ See Action Plan

---

### 12. 🟠 HIGH: Gemini API Key in Frontend Build Output

**Location:** [frontend-citizen/buildv.txt](frontend-citizen/buildv.txt#L153)

**Secret Value:** `AIzaSyAFyCDKzDdRqlSX2uGl2JJQW_FNIzNZrx8` (Different API key!)

**Risk Level:** 🟠 **HIGH**

**Impact:**
- Exposed in build artifacts
- May be indexed by search engines
- Public API key usage

**Remediation:** ✅ See Action Plan

---

## SUMMARY TABLE

| # | Secret Type | Severity | Count | Status |
|---|---|---|---|---|
| 1 | Gemini API Keys | 🔴 CRITICAL | 6 locations | Active |
| 2 | Django SECRET_KEY | 🔴 CRITICAL | 1 location | Active |
| 3 | FastAPI JWT Secret | 🔴 CRITICAL | 1 location | Active |
| 4 | Database Credentials | 🔴 CRITICAL | 8 locations | Active |
| 5 | Neo4j Credentials | 🔴 CRITICAL | 2 locations | Active |
| 6 | MinIO Credentials | 🔴 CRITICAL | 8 locations | Active |
| 7 | Meilisearch API Key | 🟠 HIGH | 2 locations | Active |
| 8 | Hardcoded Admin Credentials | 🔴 CRITICAL | 4 hardcoded | Active |
| 9 | Backend SECRET_KEY | 🔴 CRITICAL | 1 location | Active |
| 10 | Bearer Token (Rajya Sabha) | 🟠 HIGH | 1 location | Active |
| 11 | Frontend localStorage API | 🟠 HIGH | Pattern | Active |
| 12 | Frontend Build Artifact | 🟠 HIGH | 1 location | Active |

**Total CRITICAL Issues:** 8  
**Total HIGH Issues:** 4  
**Total Exposed Secret Locations:** 36+

---

## REMEDIATION PLAN

### Phase 1: Immediate Actions (Next 24 Hours)

#### 1.1: Rotate ALL API Keys Immediately

**Gemini API Keys:**
1. Go to [Google Cloud Console - API Keys](https://console.cloud.google.com/apis/credentials)
2. Delete both exposed keys:
   - `***REMOVED***`
   - `AIzaSyAFyCDKzDdRqlSX2uGl2JJQW_FNIzNZrx8`
3. Create new API keys
4. Update all code references (see Phase 2)

**Meilisearch Master Key:**
1. Access Meilisearch admin panel
2. Regenerate master key
3. Update docker-compose and config.py

**MinIO Credentials:**
1. Access MinIO admin console
2. Change root user password
3. Create new service account
4. Invalidate old credentials

**Database Credentials:**
1. Connect to PostgreSQL
   ```sql
   ALTER USER admin WITH PASSWORD 'NEW_SECURE_PASSWORD_MIN_32_CHARS';
   ```
2. Connect to Neo4j
   ```cypher
   ALTER USER neo4j SET PASSWORD 'NEW_SECURE_PASSWORD_MIN_32_CHARS';
   ```

#### 1.2: Disable Exposed Authentication

For hardcoded admin credentials in [backend/app/api/auth.py](backend/app/api/auth.py):

```bash
# Temporarily disable admin/demo logins by commenting out or changing passwords
# This prevents exploitation while you migrate to proper auth
```

#### 1.3: Create .env Files (if not done)

```bash
# Create backend/.env with proper permissions
touch backend/.env
chmod 600 backend/.env

# Create frontend-citizen/.env
touch frontend-citizen/.env
chmod 600 frontend-citizen/.env
```

#### 1.4: Invalidate Git History

Use BFG Repo-Cleaner to remove secrets from git history:

```bash
# Install BFG
# On Windows:
choco install bfg

# On macOS:
brew install bfg

# Remove credentials from history
bfg --delete-files "{docker-compose.yml,settings.py,config.py,auth.py}" --replace-text credentials.txt

# Force push cleaned history
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
```

---

### Phase 2: Code Changes (Immediate)

#### 2.1: Backend - Remove Hardcoded Secrets
