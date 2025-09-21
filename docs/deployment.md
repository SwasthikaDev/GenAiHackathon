# Deployment Guide (MVP)

## Backend (Django + DRF)
- Recommended: Render/Heroku/Fly. Steps (Render example):
  1. Create a new Web Service from the `backend/` directory
  2. Build command: `pip install -r backend/requirements.txt && python backend/manage.py migrate`
  3. Start command: `cd backend && gunicorn gt_backend.wsgi:application --bind 0.0.0.0:$PORT`
  4. Environment:
     - DJANGO_SECRET_KEY=your-secret
     - DJANGO_DEBUG=0
     - DJANGO_ALLOWED_HOSTS=your-api-host
     - DJANGO_USE_POSTGRES=1
     - DJANGO_DB_HOST=...
     - DJANGO_DB_NAME=...
     - DJANGO_DB_USER=...
     - DJANGO_DB_PASSWORD=...
     - DJANGO_DB_PORT=5432
     - DJANGO_CORS_ALLOWED_ORIGINS=https://your-frontend-host

## Frontend (Next.js)
- Recommended: Vercel
  1. Import the repo, set root to `frontend/`
  2. Env var: `NEXT_PUBLIC_API_BASE=https://your-api-host/api`
  3. Deploy

## Local Docker (optional)
- Ensure Docker Desktop is installed
- `cp env.example .env`
- `docker compose up -d` (brings up Postgres & pgAdmin)
- Start backend locally with Postgres by setting `DJANGO_USE_POSTGRES=1` in `.env` and restarting `python manage.py runserver`
