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
  lib/           # Shared utilities (supabase client, sentry-local, env, logger)
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

- Vitest + React Testing Library in `src/tests/`, Playwright E2E in `e2e/`
- File convention: `*.test.ts(x)` for Vitest, `*.spec.ts` for Playwright
- Use `pnpm test --run` in CI/scripts to avoid watch mode hanging

## Planning

Project state tracked in `.planning/`. Run `/fh:progress` to check status.
Design tokens in `.planning/DESIGN.md` — run `/fh:ui-branding` to customize.

## Gotchas

- `shadcn` must be in `dependencies` (not devDependencies) — `globals.css` imports `shadcn/tailwind.css`
- Next.js 16 renamed middleware.ts to proxy.ts — read `node_modules/next/dist/docs/` for API changes
- Proxy (`src/proxy.ts`) only applies security headers — auth redirects are in `(app)/layout.tsx`
- OAuth callback validates `x-forwarded-host` against `NEXT_PUBLIC_APP_URL`
- Sentry local mode: `SENTRY_LOCAL=true` in .env.local, query with `node src/lib/sentry-local-query.mjs recent`

# Compact Instructions

When compacting, preserve:
- Current GSD phase and plan number from .planning/STATE.md
- All locked decisions from the active phase CONTEXT.md
- File paths modified so far in this session
- Test failures and their root causes
- Any requirements or constraints the user stated this session
