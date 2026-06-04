import os
import sys

# ─────────────────────────────────────────────────────────────────────
# Windows console UTF-8 fix
# ─────────────────────────────────────────────────────────────────────
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# ─────────────────────────────────────────────────────────────────────
# PATH SETUP — must happen BEFORE any Django import or django.setup()
# ─────────────────────────────────────────────────────────────────────
if getattr(sys, 'frozen', False):
    BUNDLE_DIR = sys._MEIPASS
else:
    BUNDLE_DIR = os.path.dirname(os.path.abspath(__file__))

BACKEND_DIR = os.path.join(BUNDLE_DIR, 'backend')
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# ─────────────────────────────────────────────────────────────────────
# DJANGO SETTINGS
# ─────────────────────────────────────────────────────────────────────
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hallora_backend.settings')

import django
django.setup()

import webbrowser
import threading
import time
from django.core.management import call_command
from django.contrib.auth import get_user_model


def init_db():
    print("--------------------------------------------------")
    print("  Initializing Gateway Marriage Hall Database...  ")
    print("--------------------------------------------------")

    try:
        call_command('migrate', interactive=False, verbosity=1)
        print("[OK] Migrations applied.")
    except Exception as e:
        print(f"[ERROR] Migration error: {e}")
        return

    User = get_user_model()
    if not User.objects.exists():
        print("[INFO] No users found - seeding demo data...")
        try:
            from seed_db import seed_db
            seed_db()
            print("[OK] Demo data seeded.")
        except Exception as e:
            print(f"[ERROR] Seeding error: {e}")
    else:
        print("[OK] Existing database detected.")


def open_browser():
    time.sleep(1.5)
    url = "http://127.0.0.1:8000"
    print(f"[INFO] Opening {url} ...")
    webbrowser.open(url)


if __name__ == '__main__':
    init_db()

    threading.Thread(target=open_browser, daemon=True).start()

    from waitress import serve
    from hallora_backend.wsgi import application

    print("--------------------------------------------------")
    print("  Gateway Marriage Hall  |  http://127.0.0.1:8000 ")
    print("  Press Ctrl+C to stop.                           ")
    print("--------------------------------------------------")

    try:
        serve(application, host='127.0.0.1', port=8000, threads=6)
    except KeyboardInterrupt:
        print("\n[INFO] Server stopped.")
