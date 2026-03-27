# External Integrations

**Analysis Date:** 2026-03-27

## APIs & External Services

**Error & Performance Tracking:**
- Sentry - Error tracking, performance monitoring, and observability
  - SDK/Client: `@sentry/nextjs@10.45.0`, `@sentry/core@10.45.0`
  - Auth: `SENTRY_AUTH_TOKEN` (for sourcemap uploads during build)
  - Tunnel endpoint: `/api/sentry-local` (local mode only, stored in SQLite)
  - DSN: `NEXT_PUBLIC_SENTRY_DSN` (public, client-side)
  - Organization: `SENTRY_ORG`, `SENTRY_PROJECT` (build-time configuration)

**Email Delivery:**
- Resend - Transactional email service
  - SDK/Client: `resend@6.9.4`
  - Auth: `RESEND_API_KEY` (required for email delivery)
  - Usage: Password reset, email verification, organization invitations
  - Fallback: Development mode logs email sends without RESEND_API_KEY

## Data Storage

**Databases:**
- **PostgreSQL (Production):**
  - Connection: `DATABASE_URL` env var (PG connection string)
  - Client: `pg@8.20.0` (Node.js PostgreSQL driver)
  - Used by: Better Auth session/user management, organizations (if enabled)
  - Auth ORM: None — raw SQL queries via `pg.Pool`

- **SQLite (Local Development):**
  - Storage: `.data/local-auth.db`
  - Client: `better-sqlite3@12.8.0` (dev dependency only)
  - Purpose: Local auth fallback when `DATABASE_URL` not configured
  - Automatic migration: Runs on startup via `auth.$context.runMigrations()`
  - Activated: When `NODE_ENV !== 'production'` and `DATABASE_URL` not set

- **Sentry Local SQLite (Development):**
  - Storage: `.sentry-local/events.db`
  - Client: `better-sqlite3` (same as auth SQLite)
  - Purpose: Offline Sentry event storage when `SENTRY_LOCAL=true`
  - Used by: `src/lib/sentry-local.ts`, `/api/sentry-local` endpoint
  - Pruning: Auto-removes events older than 7 days

**File Storage:**
- Local filesystem only — no cloud storage integration

**Caching:**
- None configured — no Redis or memcached

## Authentication & Identity

**Auth Provider:**
- Better Auth (self-hosted, full-stack auth framework)
  - Implementation: `src/lib/auth.ts`
  - Database: PostgreSQL (production) or SQLite (development)
  - Session Management: Cookie-based via `next-cookies` plugin
  - Password Requirements: Minimum 8 characters
  - Secret: `BETTER_AUTH_SECRET` (32+ chars, required for production)

**Auth Features:**
- Email & password sign-in
- Email verification (requires `RESEND_API_KEY`)
- Password reset flow with email
- Organizations plugin (optional, feature-flagged via `ENABLE_ORGANIZATIONS`)
  - Organization invitation flow with email delivery
  - Session auto-loads `activeOrganizationId`
  - Limits: 1 org per user, 50 members per org, 7-day invitation TTL

**Auth Client:**
- `authClient` in `src/lib/auth-client.ts`
- Plugins: `organizationClient` (conditional on `NEXT_PUBLIC_ENABLE_ORGANIZATIONS`)

## Monitoring & Observability

**Error Tracking:**
- Sentry (primary)
  - Production DSN: `NEXT_PUBLIC_SENTRY_DSN` (sends to sentry.io)
  - Local mode: SQLite store at `.sentry-local/events.db` when `SENTRY_LOCAL=true`
  - Sample rate (production): `tracesSampleRate: 0.1` (10%)
  - Sample rate (local): `tracesSampleRate: 1.0` (100%)
  - PII enabled: `sendDefaultPii: true`

**Logs:**
- Structured logger via `src/lib/logger.ts`
  - Framework: Sentry's integrated logging
  - Output: Breadcrumbs + Sentry log levels (trace, debug, info, warn, error, fatal)
  - Format: `logger.info("message", { key: "value" })` (attrs must be string | number | boolean)
  - Console integration: Development mode shows via `consoleLoggingIntegration`

**Server-Side Error Boundary:**
- Sentry `onRequestError` hook in `instrumentation.ts`
- Automatically captures unhandled request errors

**Client-Side Error Boundary:**
- Error boundary component at `src/components/error-boundary.tsx`
- Global error handler at `src/app/global-error.tsx`

## CI/CD & Deployment

**Hosting:**
- Vercel (primary) — Next.js is Vercel-native
  - Configuration: `vercel.json`
  - Environment: Inferred from deployment platform

**Build Environment:**
- Next.js `next build` command
- Environment validation at build time via `src/lib/env.ts` (jiti loader in `next.config.ts`)
- Sentry sourcemap upload (if `SENTRY_AUTH_TOKEN` provided)

**CI Pipeline:**
- Not configured in repository — relies on GitHub Actions or Vercel CI

## Environment Configuration

**Required env vars (Production):**
- `DATABASE_URL` - PostgreSQL connection string (required for production auth)
- `BETTER_AUTH_SECRET` - 32+ character secret (required for production)
- `NEXT_PUBLIC_APP_URL` - Public app URL (default: `http://localhost:3000`)

**Optional env vars (Feature flags):**
- `SENTRY_DSN` - Sentry server-side DSN
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry client-side DSN
- `SENTRY_LOCAL` - Set to `true` for offline SQLite Sentry store (dev only)
- `NEXT_PUBLIC_SENTRY_LOCAL` - Client-side Sentry local mode flag
- `ENABLE_ORGANIZATIONS` - Set to `true` to enable org features
- `NEXT_PUBLIC_ENABLE_ORGANIZATIONS` - Client-side org feature flag

**Optional env vars (Email & Monitoring):**
- `RESEND_API_KEY` - Resend email API key (enables email verification)
- `EMAIL_FROM` - Email sender address (default: `FH Starter <noreply@fh-starter.com>`)
- `BETTER_AUTH_URL` - Auth callback URL (default: `http://localhost:3000`)
- `SENTRY_AUTH_TOKEN` - Sentry org auth token for sourcemap uploads (build-time)
- `SENTRY_ORG` - Sentry organization slug (build-time)
- `SENTRY_PROJECT` - Sentry project slug (build-time)

**Secrets location:**
- `.env.local` (development) — symlinked from workspace root
- Vercel Environment Variables (production) — managed in Vercel dashboard
- Never committed to git — `.env*` in `.gitignore`

## Webhooks & Callbacks

**Incoming:**
- `/api/sentry-local` (POST) - Sentry envelope tunnel for local development
  - Active only when `SENTRY_LOCAL=true` and `NODE_ENV=development`
  - Returns 404 otherwise
  - Accepts: events, transactions, logs, sessions, attachments, profiles, replays, metrics, spans

**Outgoing:**
- Email callbacks: None — Resend is fire-and-forget (no webhook validation)
- OAuth callbacks: None configured

## API Routes

**Auth Routes:**
- `GET/POST /api/auth/[...all]` - Better Auth handler
  - Implemented via `src/app/api/auth/[...all]/route.ts`
  - Returns 404 if auth not configured (`BETTER_AUTH_SECRET` and `DATABASE_URL` missing in production)

**Monitoring Routes:**
- `POST /api/sentry-local` - Local Sentry tunnel
  - Development-only endpoint for offline error tracking

## Development Modes

**Local Auth Mode:**
- Activated when: `NODE_ENV !== 'production'` AND `DATABASE_URL` not configured
- Uses: SQLite at `.data/local-auth.db`
- Banner displayed: Yes (shown in login form when active)
- Auto-migration: Yes, runs on auth initialization
- Secret: Hardcoded `LOCAL_DEV_SECRET` (insecure, dev-only)

**Sentry Local Mode:**
- Activated when: `SENTRY_LOCAL=true`
- Storage: SQLite at `.sentry-local/events.db`
- Query tool: `node src/lib/sentry-local-query.mjs recent`
- Requires: `better-sqlite3` (dev dependency)
- Disables remote DSN sending

---

*Integration audit: 2026-03-27*
