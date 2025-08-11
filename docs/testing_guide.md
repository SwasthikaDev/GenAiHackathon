# GlobalTrotters — Testing Guide (MVP)

## Setup
- Backend: `cd backend && source .venv/bin/activate && python manage.py runserver`
- Frontend: `cd frontend && pnpm dev`
- Frontend env: `NEXT_PUBLIC_API_BASE=http://localhost:8000/api`
- Optional seed: `python manage.py seed_demo`

## Postman Collection
- Import `docs/postman_collection.json`
- Set variables as needed (baseUrl, username, password)
- Run requests top-to-bottom:
  1) Auth → Signup → Login → Refresh → Profile
  2) Trips → List → Create → Get → Share
  3) Cities → Search cities (note `cityId` for stops)
  4) Stops & Activities → Create stop → Add activity
  5) Public → Get public itinerary by `publicSlug`

### Notes
- All endpoints use trailing slashes where applicable (e.g., `/trips/`).
- Set `Authorization: Bearer {{accessToken}}` for protected endpoints.

## UI Smoke
- Home: visible headline and copy; CTA buttons styled according to theme
- Theme: default Light; toggle switches to Dark and persists on reload
- Signup: creates user and auto-navigates to `/trips`
- Login: logs in and navigates to `/trips`; error on invalid credentials
- Trips: create a trip; list shows the new trip without refresh
- Public page: navigate to `/t/{publicSlug}` after sharing via API; shows read-only itinerary

## Acceptance Criteria
- Auth
  - Signup returns 201 and profile is retrievable with Bearer token
  - Login returns access (and refresh) tokens; invalid creds return 401/400 with an error
- Trips
  - Listing shows only the caller's trips
  - Creating a trip returns 201 and item appears in UI list immediately
- Stops/Activities
  - Stop created with valid `city_id` returns 201; activity under the stop returns 201
- Public
  - Sharing a trip returns `public_slug`; public GET returns 200 unauthenticated
  - `/t/{slug}` page renders the itinerary
- UX/Theming
  - Light theme on first load; toggle switches theme and persists (localStorage `theme`)
  - No placeholder Next/Vercel icons; custom favicon visible in browser tab
- Robustness
  - Protected endpoints without token return 401
  - No 301/500 due to missing trailing slash on POST/GET requests (APPEND_SLASH respected)

## Troubleshooting
- 500 on POST /trips: ensure path uses `/trips/` (trailing slash)
- CORS errors: verify backend `DJANGO_CORS_ALLOWED_ORIGINS` includes `http://localhost:3000`
- Favicon not updating: hard refresh or clear site data for `localhost`
- Theme not switching: ensure `<html data-theme="light">` exists and localStorage `theme` updates
