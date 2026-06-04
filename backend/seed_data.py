"""
Legacy entry point — delegates to seed_db using domain apps (not orphaned api app).
Run: python seed_data.py  OR  python seed_db.py
"""
from seed_db import seed_db

if __name__ == '__main__':
    seed_db()
