@AGENTS.md

# fh-starter-project

Production-ready Next.js starter template with auth, DB, error tracking, and testing.

## Tech Stack

Next.js 16 + React 19 + TypeScript, Tailwind v4, Shadcn/ui, Phosphor Icons, Supabase, Sentry, Zod, Biome, pnpm

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm test` | Run Vitest |
| `pnpm test:e2e` | Run Playwright |
| `pnpm check` | Biome lint + format check |
| `pnpm typecheck` | TypeScript type check |
| `pnpm format` | Biome auto-format (write mode) |

## Architecture

```
src/
  app/           # Next.js App Router (pages, layouts, API routes)
  lib/           # Shared utilities (supabase client, sentry-local, env)
  components/    # React components (ui/ for shadcn)
  tests/         # Vitest tests
e2e/             # Playwright E2E tests
supabase/        # Migrations and seed data
```

## Code Style

- Biome for formatting and linting — run `pnpm check` before committing
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Stage files individually, never `git add .`
- Server components by default; `'use client'` only when needed
- Zod schemas for all external data (API inputs, env vars, DB rows)
- Server action FormData must be parsed with Zod before use (not `as string` casts)
- Next.js 16: use `proxy.ts` (not middleware.ts), await `params`/`cookies()`/`headers()`

## Testing

- Vitest + React Testing Library in `src/tests/`
- Playwright E2E in `e2e/`
- Test file convention: `*.test.ts(x)` for Vitest, `*.spec.ts` for Playwright

## Observability

- Use `import { logger } from "@/lib/logger"` instead of `console.log` in application code
- Logger levels: `logger.trace()`, `logger.debug()`, `logger.info()`, `logger.warn()`, `logger.error()`, `logger.fatal()`
- Logger attrs must be `string | number | boolean` only — no objects, arrays, or undefined
- Set user context after auth: `Sentry.setUser({ id, email })` — clear on sign-out: `Sentry.setUser(null)`
- Add breadcrumbs for key user actions: `Sentry.addBreadcrumb({ category, message, level, data })`
- Wrap slow/critical operations with `Sentry.startSpan({ name, op }, callback)`
- Server actions: wrap with `Sentry.withServerActionInstrumentation(name, opts, fn)`
- `console.log` is acceptable only in `sentry-local` internals and test files
- Prefer "wide events" — one comprehensive log with all context over many fragmented logs

## Planning

Project planning artifacts live in `.planning/` (gitignored, auto-generated).
Design tokens in `.planning/DESIGN.md` — run `/fh:teach-impeccable` to customize.

## Database & Auth

- **No-config local dev**: leave `DATABASE_URL` and `BETTER_AUTH_SECRET` blank → SQLite fallback in `.data/local-auth.db` with auto-migration
- **Supabase**: use the **transaction pooler** URL (port 6543) from Dashboard → Settings → Database. Region prefix varies (`aws-0`, `aws-1`, etc.) — copy exactly from dashboard
- **Email verification**: skipped when `RESEND_API_KEY` is not set. To manually verify a user in Supabase: `UPDATE "user" SET "emailVerified" = true WHERE email = '...'`
- **Organizations**: require Postgres (not SQLite) — set both `ENABLE_ORGANIZATIONS` and `NEXT_PUBLIC_ENABLE_ORGANIZATIONS` to `true`

## Gotchas

- `shadcn` must be in `dependencies` (not devDependencies) — `globals.css` imports `shadcn/tailwind.css` for Tailwind v4 variants/animations
- Next.js 16 renamed middleware.ts to proxy.ts — read `node_modules/next/dist/docs/` for API changes
- `cookies()`, `headers()`, `params` are all async (must be awaited)
- Sentry local mode: set `SENTRY_LOCAL=true` in .env.local for dev SQLite store
- Run `node src/lib/sentry-local-query.mjs recent` to inspect captured errors
- Vitest: use `pnpm test --run` in CI/scripts to avoid watch mode hanging
- Proxy (`src/proxy.ts`) only applies security headers — auth redirects are in `(app)/layout.tsx`
- OAuth callback validates `x-forwarded-host` against `NEXT_PUBLIC_APP_URL` — do not trust raw header
