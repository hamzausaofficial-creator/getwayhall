#!/bin/bash
set -euo pipefail

echo "==> Waiting for PostgreSQL..."
python <<'PY'
import os
import sys
import time

import psycopg2

host = os.environ.get("DB_HOST", "db")
port = int(os.environ.get("DB_PORT", "5432"))
name = os.environ.get("DB_NAME", "hallora")
user = os.environ.get("DB_USER", "hallora")
password = os.environ.get("DB_PASSWORD", "")

for attempt in range(60):
    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            dbname=name,
            user=user,
            password=password,
            connect_timeout=3,
        )
        conn.close()
        print("PostgreSQL is ready.")
        sys.exit(0)
    except psycopg2.OperationalError:
        print(f"PostgreSQL not ready (attempt {attempt + 1}/60)...")
        time.sleep(2)

print("ERROR: PostgreSQL did not become ready in time.")
sys.exit(1)
PY

echo "==> Running database migrations..."
python manage.py migrate --noinput

echo "==> Collecting static files..."
python manage.py collectstatic --noinput

if [ "${RUN_SEED_ON_START:-false}" = "true" ]; then
    echo "==> Seeding production users..."
    python seed_production_users.py || true
    echo "==> Seeding landing page content..."
    python manage.py seed_landing || true
fi

echo "==> Ensuring media directory exists..."
mkdir -p "${MEDIA_ROOT:-/app/media}"

echo "==> Starting Gunicorn..."
exec gunicorn hallora_backend.wsgi \
    --bind "0.0.0.0:${PORT:-8080}" \
    --workers "${GUNICORN_WORKERS:-2}" \
    --timeout "${GUNICORN_TIMEOUT:-120}" \
    --access-logfile - \
    --error-logfile -
