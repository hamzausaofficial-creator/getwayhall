#!/bin/bash
set -e

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Ensuring production admin users exist..."
python seed_production_users.py

echo "Starting Gunicorn..."
exec gunicorn hallora_backend.wsgi --bind "0.0.0.0:${PORT:-8080}"
