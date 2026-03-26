# fh-starter-project

Skip the boilerplate. Start building.

This is a production-ready Next.js starter that ships with authentication, a database, error tracking, and a full testing setup already wired together. Instead of spending a week connecting Supabase to Sentry to CI, you clone this repo and start writing features on day one.

## What you get out of the box

**Authentication** -- Login, signup, password reset, and protected routes. The auth flow uses server actions with Zod validation, toast notifications for errors, and a guarded layout that redirects unauthenticated users. No raw `FormData` casts, no security shortcuts.

**Database** -- Supabase with migrations tracked in `supabase/migrations/`. Environment variables are validated at build time through `t3-env` + Zod, so you'll know about missing config before your users do.

**Error tracking** -- Sentry integration with a local development mode. Set `SENTRY_LOCAL=true` and errors get stored in a local SQLite database instead of flying off to a remote service. Query them with `node src/lib/sentry-local-query.mjs recent`. No Sentry account needed during development.

**Testing** -- Vitest for unit/integration tests, Playwright for E2E. Both are configured and have working examples. The CI pipeline runs lint, typecheck, and tests on every push and PR.

**Code quality** -- Biome handles formatting and linting. Husky + lint-staged run checks on every commit. Conventional commit messages are enforced.

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 + React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind v4 |
| Components | shadcn/ui + Radix primitives |
| Icons | Phosphor Icons |
| Auth & DB | Supabase (migrating to Better Auth) |
| Email | Resend + React Email |
| Error tracking | Sentry (with local SQLite mode) |
| Validation | Zod |
| Linting | Biome |
| Testing | Vitest + Playwright |
| Package manager | pnpm |

## Getting started

```bash
# Clone and install
pnpm install

# Set up your environment
cp .env.example .env.local
# Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, etc.

# Start developing
pnpm dev
```

The app runs without Supabase configured -- auth pages will render but skip the auth gate. This lets you work on UI and non-auth features immediately.

## Project structure

```
src/
  app/
    (auth)/          Login, signup, forgot/update password
    (protected)/     Dashboard and authenticated pages
    api/             API routes (Sentry local, auth callback)
  components/        Shared React components (ui/ for shadcn)
  lib/               Utilities -- Supabase clients, env config, Sentry local store
  tests/             Vitest tests
e2e/                 Playwright E2E tests
supabase/            Database migrations and seed data
```

**Route groups** keep concerns separated: `(auth)` handles the login flow, `(protected)` enforces authentication at the layout level. No scattered auth checks across pages.

## Commands

| Command | What it does |
|---------|-------------|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Run end-to-end tests |
| `pnpm check` | Lint and format check |
| `pnpm typecheck` | TypeScript type check |
| `pnpm format` | Auto-format with Biome |

## How CI works

Every push to `main` and every pull request triggers the CI pipeline (`.github/workflows/ci.yml`):

1. Install dependencies with frozen lockfile
2. Lint with Biome
3. Typecheck with TypeScript
4. Run the test suite

No manual quality gates -- the pipeline catches problems before they land.

## Design decisions worth knowing

**Server components by default.** Client components (`'use client'`) are used only where interactivity requires them -- forms, toasts, sign-out buttons. Everything else renders on the server.

**Zod everywhere data crosses a boundary.** Environment variables, form submissions, API inputs -- all validated with Zod schemas. The `t3-env` integration means a missing env var fails the build, not a user request.

**Local-first error tracking.** The Sentry local mode stores events in SQLite during development. You can inspect errors without needing a Sentry account or internet connection. The same Sentry integration works with a real DSN in production.

**Graceful degradation.** When Supabase isn't configured, protected pages render without the auth gate and the dashboard shows a "not configured" message. You're never blocked from working on the parts that don't need auth.

## License

Private. See `package.json` for details.
