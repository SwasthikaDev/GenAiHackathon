## Team Rules and Working Agreements

### 1) Collaboration & Process
- Use vertical slices: deliver features end-to-end (API, UI, tests) rather than frontend- or backend-only.
- Branching model: `main` (stable), `dev` (integration), feature branches `feat/<scope>`; bugfix `fix/<scope>`.
- Pull requests: small, focused, with description, screenshots, and acceptance criteria. Require at least one review.
- Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`, `build:`, `ci:`.
- Definition of Done (each PR): code compiles, lints, basic tests pass, updated docs/types, no TODOs, review approved.

### 2) Code Style & Tooling
- Backend (Python/Django)
  - Follow PEP 8. Use `black`, `isort`, `flake8` or `ruff`. Prefer `pytest`.
  - DRF serializers and viewsets; explicit permissions; pagination for lists.
  - Use `drf-spectacular` to generate OpenAPI; keep serializers the single source of truth.
- Frontend (Next.js/TypeScript)
  - ESLint + Prettier; strict TypeScript. Avoid `any`.
  - Use TanStack Query for server state; keep local UI state minimal.
  - Components: accessible by default; keyboard support for interactive elements.
- Shared
  - Pre-commit hooks for format/lint. CI runs lint + tests on PRs.

### 3) API Contracts
- All endpoints documented in OpenAPI. Breaking changes require coordinated PRs (backend first; release types; then frontend).
- Frontend types are generated (`openapi-typescript`); do not hand-roll duplicative types.

### 4) Security & Privacy
- JWT in httpOnly cookies via Next.js BFF proxy. CSRF enforced for unsafe methods if cookies-based.
- CORS limited to known frontend origins. Do not log secrets or PII. Validate and sanitize inputs.
- Store secrets only in `.env` files and secret managers; never commit. Provide `env.example`.

### 5) Database & Migrations
- Postgres only. Every model change includes a migration.
- Seed data through management commands/fixtures; idempotent.

### 6) Testing
- Backend: unit tests for serializers, permissions, critical viewsets; API tests for happy paths.
- Frontend: unit tests for utilities/components; minimal E2E smoke for auth and trips happy path.
- Aim for pragmatic coverage; prioritize critical flows.

### 7) Performance & Accessibility
- Track Core Web Vitals on key pages; budget for fast FCP/LCP; SSR public pages.
- Accessibility baseline: semantic HTML, labels, focus states, color contrast AA, keyboard navigation.

### 8) Reviews & Priority Calls
- If blocked >30 minutes, post a short note in PR/issue and propose options.
- Prefer shipping the simplest version that meets acceptance criteria; defer enhancements to follow-ups.

### 9) Ownership
- Each task has an explicit owner. Unowned tasks don’t start. Keep `tasklist.md` up to date.



### 11) Pitfalls & Conventions (Lessons Learned)
- DRF trailing slashes: APPEND_SLASH is enabled. All API calls MUST include trailing slashes, especially for POST/PUT/PATCH/DELETE (e.g., `/api/trips/`, `/api/trips/{id}/share/`, `/api/cities/ensure/`). Missing slash causes 301/500 and drops POST data.
- Frontend HTTP helper: use `authFetch` for protected endpoints so auth headers, error handling, and auto-logout on 401 are consistent.
- Client vs Server components: React hooks or `ssr: false` dynamic imports require a Client Component wrapper. Do not use them directly in server files.
- Error UX: never surface raw backend JSON to users. Map common errors to friendly messages and log details to console only when necessary.
- Search UX: debounce typeahead calls (≥300ms) and abort in-flight requests; require at least 2 characters before hitting search endpoints.