## GlobalTrotters Travel Planner — Requirements

### 1) Goal and Scope
- Build a complete travel planning web app with a relational backend and dynamic UI for creating and sharing multi‑city itineraries.
- Backend: Django + DRF + Postgres. Frontend: Next.js (React) + TypeScript, responsive and PWA-ready.
- Public, SEO-friendly share pages; authenticated user flows for planning; optional admin analytics.

Reference mockup for UX flow: [Excalidraw](https://link.excalidraw.com/l/65VNwvy7c4X/6CzbTgEeSr1)

### 2) Functional Requirements (MVP)
- Authentication
  - Email/password signup, login, logout, token refresh.
  - Protected routes for signed-in users.
- Trips
  - Create trip: name, start_date, end_date, description, optional cover image.
  - List user trips with summary; view, update, delete.
- Itinerary Builder
  - Add stops (city, start/end dates, order); add activities to each stop.
  - Reorder stops (basic first; drag-and-drop is nice-to-have).
- Itinerary View
  - Readable day-wise or grouped-by-city view of stops/activities with time/cost.
- City Search
  - Search cities (name, country, region). Include metadata (cost_index, popularity) when available.
- Activity Search
  - Browse/select activities per stop (type, cost, duration). Seeded catalog is acceptable.
- Budget & Cost Breakdown
  - Compute totals and category breakdown (transport, stay, activities, meals, other).
  - Basic charts.
- Calendar/Timeline View
  - Visual calendar or vertical timeline of the trip; simple edits.
- Public Share
  - Public, read-only itinerary via shareable URL (slug). SSR for SEO.
- Profile/Settings
  - Update profile fields (name, photo, email), language preference; view saved destinations.

### 3) Nice-to-have (if time permits)
- Drag-and-drop for cities/activities; advanced filters; image uploads; copy-trip flow; social sharing widgets; admin/analytics dashboard; offline caching and richer PWA features; maps integration.

### 4) Architecture
- Frontend
  - Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui.
  - Data: TanStack Query; auth handled via Next Route Handlers as BFF proxy to DRF; httpOnly cookies for access/refresh.
  - Libraries: FullCalendar or React Big Calendar; dnd-kit; Chart.js or Recharts; react-leaflet for maps; next-pwa for PWA.
- Backend
  - Django 5, DRF, Postgres. JWT with `djangorestframework-simplejwt`.
  - `drf-spectacular` for OpenAPI; `django-cors-headers`; `Pillow` for images (if used).
- Deployment
  - Frontend on Vercel (or similar). Backend on Render/Fly/Heroku. Postgres managed or Docker.
  - CI: lint/test on PRs; infra via `.env` files and `env.example`.

### 5) Data Model (overview)
- User (auth user)
- Trip (user, name, start_date, end_date, description, cover_image, is_public, public_slug)
- TripStop (trip, city, start_date, end_date, order)
- Activity (trip_stop, title, type/category, start_time, end_time, cost_amount, currency, notes)
- BudgetItem (trip, category: transport|stay|activities|meals|other, amount, currency, linked_activity optional)
- City (name, country, region, cost_index optional, popularity optional)
- ActivityCatalog (global reference: title, type, avg_cost, duration, city optional)

Notes
- Keep costs in minor units with currency code; compute totals server-side to avoid drift.
- Public itineraries are read-only views by `public_slug`.

### 6) API Surface (MVP sketch)
- Auth
  - POST /api/auth/signup
  - POST /api/auth/login
  - POST /api/auth/refresh
  - POST /api/auth/logout
- Profile
  - GET/PUT /api/profile
- Trips
  - GET/POST /api/trips
  - GET/PUT/PATCH/DELETE /api/trips/{trip_id}
  - POST /api/trips/{trip_id}/share (toggle public, returns public_slug)
- Stops (nested)
  - GET/POST /api/trips/{trip_id}/stops
  - GET/PUT/PATCH/DELETE /api/trips/{trip_id}/stops/{stop_id}
  - POST /api/trips/{trip_id}/stops/reorder
- Activities (nested under stop)
  - GET/POST /api/trips/{trip_id}/stops/{stop_id}/activities
  - GET/PUT/PATCH/DELETE /api/.../activities/{activity_id}
- Budget
  - GET /api/trips/{trip_id}/budget/summary
  - GET/POST /api/trips/{trip_id}/budget/items
- Search
  - GET /api/search/cities?q=...
  - GET /api/search/activities?q=...&city_id=...
- Public
  - GET /api/public/itineraries/{public_slug}

### 7) Non‑Functional Requirements
- SEO for public pages (SSR/SSG/ISR). Performance: 
  - First Contentful Paint (FCP) < 1.5s
  - Largest Contentful Paint (LCP) < 2.5s
  - API response times < 200ms (95th percentile)
  - Page load times < 3s on 3G connection
- Responsive design (mobile-first); accessibility AA compliance.
- Security: httpOnly cookies for JWT, CSRF for unsafe requests if cookies-based; CORS locked to frontend.
- Observability: basic request logging; client error logging; performance monitoring.
- Testing: happy-path unit/API tests; minimal E2E smoke for critical flows.

### 8) MVP Acceptance Criteria
- Users can sign up, log in, create a trip with 2+ stops and activities, view budget summary and calendar, and share a public read-only link that renders with SSR.
- OpenAPI spec generated and types consumed by frontend; CI green.
- Performance: Public share pages load under 2.5s LCP; authenticated pages under 1.5s FCP.
- All core user flows work on mobile and desktop browsers.
- At least 80% test coverage on critical API endpoints.
- Demo-ready with realistic seed data (50+ cities, 200+ activities).

### 9) Data & Content
- Seed datasets for realistic demos:
  - Cities: 50+ major cities across 6 continents with metadata (country, region, cost_index 1-5, popularity score)
  - Activities: 200+ sample activities across categories (sightseeing, food, adventure, culture, nightlife)
  - Sample trips: 5+ complete itineraries for different travel styles
- No external APIs required for MVP; all data self-contained.


