# Hallora Venue Management SaaS

A full-stack venue management system built with ReactJS, Django, and PostgreSQL, based on the Stitch design system.

## Project Structure

- `/frontend`: React + Vite application with the premium Hallora design system.
- `/backend`: Django REST Framework API with PostgreSQL integration.

## Design System
- **Primary Color**: #FF6B2C (Hallora Orange)
- **Typography**: Inter
- **Aesthetic**: Modern, Corporate SaaS (Linear/Stripe inspired)

## Tech Stack
- **Frontend**: React, React Router, Axios, Lucide React, CSS Variables
- **Backend**: Django, DRF, Django-CORS-Headers
- **Database**: PostgreSQL (Ready for integration)

## Getting Started

### Prerequisites
- Python 3.x
- Node.js & npm
- PostgreSQL (optional for local dev, can switch back to SQLite in settings.py)

### Backend Setup
1. Navigate to `backend/`
2. Activate venv: `.\venv\Scripts\activate`
3. Run migrations: `python manage.py makemigrations` and `python manage.py migrate` (ensure PSQL is running or switch to SQLite)
4. Start server: `python manage.py runserver`

### Frontend Setup
1. Navigate to `frontend/`
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev`

## Features Implemented
- **Landing Page**: Premium hero section, features grid, and trusted brands section.
- **Dashboard Overview**: Revenue, bookings, and customer statistics with interactive tables.
- **Sidebar Navigation**: Intuitive access to halls, customers, and calendar modules.
- **Venue/Customer/Booking Models**: Robust backend structure for event management.
