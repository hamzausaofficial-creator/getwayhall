# Gateway Marriage Hall Management

Full-stack marriage hall / venue management: bookings, calendar, halls, customers, payments, expenses, inventory, decoration packages, staff, reports, SMS/WhatsApp notification log, and role-based access per tenant.

## Project structure

- `frontend/` — React + Vite (Gateway UI)
- `backend/` — Django REST API (`hallora_backend`)

## Tech stack

- **Frontend:** React, React Router, Axios, Lucide, date-fns
- **Backend:** Django, DRF, SimpleJWT, django-filter
- **Database:** SQLite (default dev) or PostgreSQL

## Environment variables

Copy `.env.example` to `backend/.env` (or project root as your setup expects):

| Variable | Purpose |
|----------|---------|
| `SECRET_KEY` | Django secret |
| `NOTIFICATION_BACKEND` | `console` (dev) or `twilio` (live SMS/WhatsApp) |
| `TWILIO_*` | Twilio credentials when using live notifications |
| `DB_*` | PostgreSQL connection (optional) |

## Getting started

### Backend

```powershell
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_db
python manage.py runserver
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Default API base: `http://127.0.0.1:8000/api` (see `frontend/src/api/client.js`).

## Features

- **Bookings** — overlap checks, decoration package link, inventory allocation per event, lena (amount due) / `00` when nothing due
- **Calendar** — view, create, edit (navigate to bookings), cancel, record payment
- **Halls** — ACTIVE/INACTIVE; inactive halls hidden from new booking dropdowns
- **Payments** — `advance_paid` synced from completed payments
- **Notifications** — in-app bell prefs, optional SMS/WhatsApp to customers (skips if no phone; no form validation)
- **Security** — tenant-scoped querysets, ADMIN / MANAGER / STAFF permissions
- **Staff** — HR fields (phone, salary, joining date), admin password reset

## Roles

| Role | Typical access |
|------|----------------|
| ADMIN | Full access, staff, settings |
| MANAGER | Operations except staff write |
| STAFF | Read bookings/customers, record payments |

## Cron (payment reminders)

```powershell
python manage.py send_payment_reminders
```

Schedule daily via Windows Task Scheduler or cron on Linux.

## Deprecated

The legacy `backend/api/` app is unused; see `backend/api/DEPRECATED.md`.
