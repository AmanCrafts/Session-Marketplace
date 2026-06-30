# Sessions Marketplace backend image.
#
# Build:
#   docker build -t sessions-backend -f backend/Dockerfile backend
#
# Run:
#   docker run --rm -p 8000:8000 --env-file backend/.env sessions-backend

FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# System deps. psycopg needs libpq; build-essential kept for any wheels
# that need to compile. They are safe to drop later.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps first so source changes don't bust this layer.
COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy the rest of the source.
COPY . /app

# Drop privileges for runtime.
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

EXPOSE 8000

# Default command runs migrations then starts gunicorn.
CMD ["sh", "-c", "python manage.py migrate --noinput && gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 3 --access-logfile -"]