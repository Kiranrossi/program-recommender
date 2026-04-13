# NSRCEL Application Management System (Local)

## Services
- Frontend: Next.js at `http://localhost:3000`
- Backend: FastAPI at `http://localhost:8000`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

## Backend setup
1. Create and activate a Python 3.11 virtualenv in `backend/`.
2. Install dependencies:
   - `pip install -r requirements.txt`
3. Copy env file:
   - `cp .env.example .env`
4. Set `DATABASE_URL` in `backend/.env` (local Postgres or Supabase). For Supabase use the **direct** Postgres URI with the `postgresql+asyncpg://` prefix (same host/user/password as the dashboard “URI”, with `+asyncpg` after `postgresql`). If TLS verification fails on your network, set `DATABASE_SSL_INSECURE=true` only for local debugging.
5. Run migrations:
   - `cd backend && PYTHONPATH=. alembic upgrade head`
6. Seed programs:
   - `cd backend && PYTHONPATH=. python -m scripts.seed_programs`
7. Start API:
   - `cd backend && PYTHONPATH=. uvicorn app.main:app --reload --host 0.0.0.0 --port 8001`

### Supabase (optional)
- **Database:** Project Settings → Database → connection string (direct). Use password in the URI; the app uses SSL automatically for `*.supabase.co`.
- **API keys:** `SUPABASE_URL` + publishable key in `backend/.env` / `frontend/.env.local` if you add Supabase client features later. Do **not** expose the **secret** (service_role) key in the frontend.

## Frontend setup
1. Install dependencies in `frontend/`:
   - `npm install`
2. Copy env:
   - `cp .env.local.example .env.local`
3. Start frontend:
   - `npm run dev`

## Notes
- API docs are available at `http://localhost:8000/docs`.
- Auth middleware currently supports local token decode mode (`CLERK_JWT_VERIFY=false`) for development.
- Local uploads are served at `/uploads/...` and can be attached via `POST /api/v1/applications/{id}/files`.
- Strict auto-shortlist is enabled by `AUTO_SHORTLIST_THRESHOLD` (default `80`), after which HITL/admin review and final decision still apply.
