web: cd backend && gunicorn hallora_backend.wsgi --bind 0.0.0.0:$PORT
release: cd backend && python manage.py migrate --noinput
