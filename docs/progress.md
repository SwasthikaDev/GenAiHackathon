## Progress Log

Timestamp: 2025-08-11 08:45 (local)

### Done
- Repo structure initialized: `backend/`, `frontend/`, `docs/`
- Root configs created: `.editorconfig`, `.gitignore`, `env.example`
- Docker Compose file added for Postgres/pgAdmin (not running locally; Docker unavailable)
- Backend (Django):
  - Project `gt_backend` with apps `accounts`, `trips`
  - Settings wired: DRF, JWT (SimpleJWT), CORS, Spectacular docs (`/api/docs`)
  - Custom `User` model + admin
  - Core models: `City`, `Trip`, `TripStop`, `Activity`, `ActivityCatalog`
  - Serializers + ViewSets; nested routes for stops/activities
  - Auth endpoints: `signup`, `login`, `refresh`, `logout`, `profile`
  - Public itinerary endpoint: `GET /api/public/itineraries/{slug}`
  - Seed command and demo data seeded
  - Migrations applied; dev server running on http://localhost:8000
  - Origin support: `Trip.origin_city` added; serializers/admin updated

### In Progress
- Frontend polishing (theme, favicon, hero), Trips UI
  - Trips list: create, list, delete; shows origin and links to detail
  - Trip detail: stops list, add stop (city search), add activity, share toggle, public link
  - AuthGuard on protected pages; theme toggle (light default)
  - API Console at `/tools/api-console` for in-browser API tests

### Next (Critical Path)
- Budget: simple totals (activities sum) and summary endpoint/UI
- Public page polish: show origin and basic route summary
- Deployment prep (envs, simple hosting)

### Blockers/Risks
- Docker not installed; using SQLite for local dev. Postgres can be enabled later via `DJANGO_USE_POSTGRES=1` when Docker/DB is available.

### Milestones Check
- Hour 2: Setup complete — Achieved
- Hour 6: Backend scaffold + Auth working — Achieved
- Hour 8: Frontend scaffold + Auth screens — Achieved

### Current Capabilities
- Backend API: auth (signup/login/refresh/logout/profile), trips, stops, activities, city search (basic), public itinerary by slug
- Places search enabled (external); seeding retired from workflow
- Frontend: home, Sign in, Sign up, trips (create/list/delete), trip detail (stops/activities/share), origin selection, theme toggle, API console, custom favicon/branding
