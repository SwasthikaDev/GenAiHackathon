## Task List (MVP-first, vertical slices)

Legend: [ ] todo, [x] done, (owner) in parentheses, [time estimate], <dependency>

**Timeline**: Single-Day Hackathon (18 hours total)
**Milestones**:
- Hour 6: Backend + Frontend scaffolds ready, auth working
- Hour 12: Core MVP features complete (trips, basic itinerary)
- Hour 16: Public sharing working
- Hour 18: Deployed and demo-ready

### 0) Project Setup [Milestone: Hour 1] 🏁 **CRITICAL PATH**
- [x] Initialize repo structure: `backend/`, `frontend/`, `docs/` (owner: team-lead) [15min]
- [x] Create `.editorconfig`, `.gitignore`, `env.example` (owner: team-lead) [10min] <repo-structure>
- [x] Docker Compose: Postgres + pgAdmin; networks/volumes (owner: backend-dev) [30min]
- [ ] ~~CI: lint + test for both apps (GitHub Actions)~~ **SKIP FOR SPEED**

### 1) Backend Scaffold [Milestone: Hour 6] 🎯 **CRITICAL PATH**
- [x] Django project `gt_backend`, apps: `accounts`, `trips` (owner: backend-dev) [20min] <docker-setup>
- [x] Configure Postgres via env vars; `django-cors-headers` (owner: backend-dev) [15min] <django-project>
- [x] Install DRF, `djangorestframework-simplejwt`, `drf-spectacular` (owner: backend-dev) [10min] <django-project>
- [x] Models: User (extend), Trip, TripStop, Activity, City (simple) (owner: backend-dev) [1.5h] <packages>
- [x] Admin registrations, basic fixtures (owner: backend-dev) [20min] <models>
- [x] Serializers and ViewSets; basic CRUD routes (owner: backend-dev) [2h] <models>
- [x] Auth endpoints: signup/login/logout only (owner: backend-dev) [1h] <serializers>
- [x] Basic city/activity endpoints (owner: backend-dev) [30min] <serializers>
- [x] Public itinerary read-only endpoint by `public_slug` (owner: backend-dev) [20min] <serializers>
- [x] Seed command for sample cities/activities (owner: backend-dev) [30min] <models>
- [ ] ~~Tests~~ **SKIP FOR SPEED** ⚠️ Manual testing only

### 2) Frontend Scaffold [Milestone: Hour 6] 🎯 **CRITICAL PATH**
- [x] Next.js app (App Router), TypeScript, Tailwind (owner: frontend-dev) [30min] <repo-structure>
- [x] Basic API client; simple auth with localStorage (owner: frontend-dev) [45min] <nextjs-app>
- [ ] ~~OpenAPI types~~ **SKIP** - Manual types for speed
- [x] Global layout, nav, simple styling (owner: frontend-dev) [30min] <api-client>

### 3) Slice A: Auth [Milestone: Hour 8] 🏁 **CRITICAL PATH**
- [x] Pages: Login, Signup (basic forms) (owner: frontend-dev) [1h] <frontend-scaffold>
- [x] Simple localStorage auth (owner: frontend-dev) [30min] <auth-pages>
- [x] Protected routes guard (owner: frontend-dev) [20min] <auth-flow>
- [ ] ~~Tests~~ **SKIP FOR SPEED**

### 4) Slice B: Trips CRUD [Milestone: Hour 10] 🎯 **CRITICAL PATH**
- [x] Trips list page (CSR) with basic cards (owner: frontend-dev) [45min] <auth-complete>
- [x] Create Trip form (name, dates only) (owner: frontend-dev) [45min] <trips-list>
- [x] Delete trip (simple confirm) (owner: frontend-dev) [15min] <create-trip>
- [x] API integration (owner: full-stack) [30min] <trip-forms>

### 5) Slice C: Basic Itinerary [Milestone: Hour 12] 🎯 **CRITICAL PATH**
- [x] Add stops to trip (city, dates) (owner: frontend-dev) [1h] <trips-crud>
- [x] Add activities to stops (name, cost) (owner: frontend-dev) [1h] <stops-ui>
- [x] Simple city dropdown (pre-seeded) (owner: frontend-dev) [30min] <backend-search>
- [ ] ~~Advanced search/validation~~ **CUT FOR TIME**

### 6) ~~Budget & Cost Breakdown~~ **MOVED TO STRETCH** ⭐
- [ ] Simple cost totals only (owner: frontend-dev) [30min] <itinerary>

### 7) ~~Calendar/Timeline View~~ **MOVED TO STRETCH** ⭐ 
- [ ] Basic list view of itinerary (owner: frontend-dev) [30min] <itinerary>

### 8) Slice F: Public Share [Milestone: Hour 16] 🏁 **CRITICAL PATH**
- [x] Share toggle → get `public_slug` (owner: backend-dev) [30min] <itinerary-complete>
- [x] Public page (CSR) at `/t/{slug}` (owner: frontend-dev) [1h] <share-endpoint>
- [ ] ~~SEO metadata~~ **SKIP FOR SPEED**

### 9) Deployment [Milestone: Hour 18] 🏁 **CRITICAL PATH**
- [ ] Deploy backend (simple hosting) (owner: devops) [45min] <public-share-complete>
- [ ] Deploy frontend (Vercel/Netlify) (owner: devops) [30min] <backend-deployed>
- [ ] Connect and test (owner: devops) [15min] <frontend-deployed>

### 10) ~~Perf, A11y, PWA~~ **MOVED TO STRETCH** ⭐

### 11) Stretch/Nice-to-have [If Miraculously Ahead] ⭐
- [ ] Budget breakdown with charts (owner: frontend-dev) [1h]
- [ ] Calendar/timeline view (owner: frontend-dev) [1.5h]
- [ ] PWA features (owner: frontend-dev) [45min]
- [ ] Better styling and UX (owner: frontend-dev) [1h]
- [ ] Advanced search (owner: backend-dev) [1h]

### Notes
- City seeding removed from workflow; use Places search + cities/ensure.

### Risk Mitigation & Contingency Plans
- **If backend dev falls behind**: Simplify models, use Django admin for some features initially
- **If frontend dev falls behind**: Use basic HTML forms instead of rich components
- **If deployment issues**: Have local demo ready with Docker Compose
- **If search is complex**: Use simple string matching instead of full-text search
- **Critical path**: Auth → Trips CRUD → Basic Itinerary → Public Share

### Team Roles
- **backend-dev**: Python/Django expert
- **frontend-dev**: React/Next.js expert  
- **devops**: Deployment and CI/CD
- **full-stack**: Can help either side
- **team-lead**: Coordination and project setup

### Hourly Check-ins (5min each)
- **Hour 2**: Setup complete? Any blockers?
- **Hour 6**: Scaffolds working? Auth flow ready?  
- **Hour 10**: Trips CRUD working? Ready for itinerary?
- **Hour 12**: Basic itinerary done? Start sharing feature?
- **Hour 16**: Public sharing working? Ready to deploy?
- **Hour 17**: Deployment status? Demo prep?

**EMERGENCY CUTS if behind schedule:**
1. Skip user signup - just use hardcoded users
2. Skip authentication - public app only  
3. Skip activities - just cities and dates
4. Skip database - use JSON files
5. Skip deployment - local demo only

Notes
- Keep this list updated every 2 hours. Move completed tasks to bottom with [x].
- Total estimated time: ~16 hours (critical path only)


