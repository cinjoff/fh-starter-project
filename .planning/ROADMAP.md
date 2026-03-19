# Roadmap

## Phase 1: Project Scaffolding and Core Setup
**Goal:** Working Next.js app with all dependencies installed, dev tooling configured, and base layout rendering.

**Requirements:** REQ-01, REQ-02 (partial)

**Deliverables:**
- All npm dependencies installed
- Biome configured and working
- Husky + lint-staged pre-commit hooks
- t3-env environment validation scaffold
- Shadcn/ui initialized with default theme
- Phosphor Icons available
- Base layout with error boundary
- Home page placeholder
- conductor.json and vercel.json
- `pnpm dev` starts, `pnpm build` succeeds

---

## Phase 2: Authentication and Database
**Goal:** Working Supabase auth flow with protected routes and a minimal database schema.

**Requirements:** REQ-03, REQ-04, REQ-09

**Deliverables:**
- Supabase client (server + browser)
- Auth proxy (proxy.ts) with session refresh
- Login/signup page
- Auth callback route
- Protected route pattern with redirect
- Minimal migration (profiles table)
- Zod schemas for database types
- .env.example with all Supabase vars
- Environment validation via t3-env

---

## Phase 3: Error Tracking and Security
**Goal:** Sentry capturing errors in both dev (local SQLite) and production modes. Security headers hardened.

**Requirements:** REQ-05, REQ-07

**Deliverables:**
- sentry.server.config.ts with local/production modes
- instrumentation.ts + instrumentation-client.ts
- /api/sentry-local tunnel endpoint
- sentry-local-query.mjs CLI tool
- Security headers in proxy.ts (CSP, HSTS, etc.)
- React error boundary component
- Error boundary wired into root layout

---

## Phase 4: Testing and CI
**Goal:** Green test suite with minimal examples covering unit, component, and E2E patterns.

**Requirements:** REQ-06, REQ-08

**Deliverables:**
- Vitest config with React support
- Example unit test (utility function)
- Example component test
- Playwright config
- Example E2E test (home page loads, auth flow)
- GitHub Actions workflow (lint, typecheck, test)
- All tests passing

---

## Phase 5: Documentation and Polish
**Goal:** Template is ready for use. All code documented, CLAUDE.md comprehensive, README clear.

**Requirements:** REQ-10, REQ-02 (remaining)

**Deliverables:**
- CLAUDE.md finalized (under 40 lines)
- All files have purpose comments
- README with setup instructions
- .env.example complete
- Shadcn/ui component examples
- Final `pnpm build` + `pnpm test` passing
