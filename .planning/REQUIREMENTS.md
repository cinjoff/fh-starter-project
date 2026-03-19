# Requirements

## REQ-01: Project Scaffolding
Configure Next.js 16 + TypeScript + Tailwind v4 + pnpm with proper tsconfig, ESLint, Biome, and build scripts. Install all dependencies. Set up conductor.json and vercel.json.

**Dependencies:** npm packages: `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `@t3-oss/env-nextjs`, `@sentry/nextjs`, `@sentry/core`, `better-sqlite3`, `@phosphor-icons/react`
**Dev dependencies:** `vitest`, `@vitejs/plugin-react`, `@playwright/test`, `@biomejs/biome`, `husky`, `lint-staged`, `@types/better-sqlite3`

## REQ-02: Component Library
Initialize Shadcn/ui with default neutral theme. Install Phosphor Icons. Create minimal component examples demonstrating usage patterns.

## REQ-03: Authentication
Set up Supabase Auth with SSR support. Create auth proxy (proxy.ts for Next.js 16). Implement login/signup page, auth callback route, and protected route pattern. Session refresh on navigation.

## REQ-04: Database
Configure Supabase Postgres client. Create minimal initial migration (e.g., profiles table linked to auth.users). Add Zod schemas for type-safe database types. Document migration workflow.

## REQ-05: Error Tracking
Integrate Sentry SDK for both client and server. Implement local SQLite transport for development (sonica pattern). Create instrumentation.ts, instrumentation-client.ts, sentry.server.config.ts, and /api/sentry-local tunnel endpoint. Query tool for agents at src/lib/sentry-local-query.mjs.

## REQ-06: Testing
Set up Vitest for unit/integration tests with React Testing Library. Set up Playwright for E2E tests. Create minimal test examples for: a utility function, a component, and an E2E auth flow. All tests must pass green.

## REQ-07: Security
Add CSP, HSTS, X-Frame-Options, and other security headers via Next.js proxy.ts. React error boundary component. Rate limiting awareness (documented pattern, not enforced in template).

## REQ-08: Code Quality
Configure Biome for formatting and additional linting rules. Husky pre-commit hook running lint-staged (biome check + typecheck). GitHub Actions workflow for CI on PRs.

## REQ-09: Environment Validation
Use @t3-oss/env-nextjs + Zod to validate all environment variables at startup. Provide .env.example with all required vars documented.

## REQ-10: Documentation
Comprehensive CLAUDE.md under 40 lines. All code files documented with purpose comments. Minimal working examples for every integration. README with setup instructions.
