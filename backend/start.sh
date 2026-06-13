#!/bin/bash
set -e

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Ensuring production admin users exist..."
python seed_production_users.py

echo "Ensuring landing page content exists..."
python manage.py seed_landing

echo "Ensuring media upload directory exists..."
mkdir -p "${MEDIA_ROOT:-media}"

echo "Starting Gunicorn..."
exec gunicorn hallora_backend.wsgi --bind "0.0.0.0:${PORT:-8080}"
