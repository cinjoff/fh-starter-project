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
- Next.js 16: use `proxy.ts` (not middleware.ts), await `params`/`cookies()`/`headers()`

## Testing

- Vitest + React Testing Library in `src/tests/`
- Playwright E2E in `e2e/`
- Test file convention: `*.test.ts(x)` for Vitest, `*.spec.ts` for Playwright

## Planning

Project state tracked in `.planning/`. All 5 phases complete.
Design tokens in `.planning/DESIGN.md` — run `/fh:teach-impeccable` to customize.

## Gotchas

- Next.js 16 renamed middleware.ts to proxy.ts — read `node_modules/next/dist/docs/` for API changes
- `cookies()`, `headers()`, `params` are all async (must be awaited)
- Sentry local mode: set `SENTRY_LOCAL=true` in .env.local for dev SQLite store
- Run `node src/lib/sentry-local-query.mjs recent` to inspect captured errors
- Vitest: use `pnpm test --run` in CI/scripts to avoid watch mode hanging
