# Runtime Image for Backend Services
FROM python:3.11-slim

# Install system dependencies for PostgreSQL and health checks
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install All Backend dependencies
COPY backend/requirements.txt ./backend/requirements.txt
COPY backend_nlp/requirements.txt ./backend_nlp/requirements.txt
COPY Parli_backend/requirements.txt ./Parli_backend/requirements.txt
RUN pip install --upgrade pip && \
    pip install --default-timeout=300 --retries 10 --no-cache-dir \
    -r backend/requirements.txt \
    -r backend_nlp/requirements.txt \
    -r Parli_backend/requirements.txt || \
    pip install django djangorestframework django-cors-headers requests pandas fuzzywuzzy pdfplumber pypdf deep-translator tqdm torch transformers

# Copy all source code
COPY backend/ ./backend/
COPY backend_nlp/ ./backend_nlp/
COPY Parli_backend/ ./Parli_backend/

# Set environment variables
ENV PYTHONPATH=/app
ENV PORT=8000

# Expose the API port
EXPOSE 8000

# Start the application
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]