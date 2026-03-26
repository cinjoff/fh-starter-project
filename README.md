# fh-starter-project

An opinionated starter template for building full-stack applications, designed to be used with [fhhs-skills](https://github.com/cinjoff/fhhs-skills) — a Claude Code skill pack for shipping production-quality software with AI assistance.

Skip the boilerplate. Start building. This template ships with authentication, a database, error tracking, and a full testing setup already wired together. Instead of spending a week connecting Better Auth to Supabase to Sentry to CI, you clone this repo and start writing features on day one.

## What you get out of the box

**Authentication** — Better Auth with email/password login, signup, password reset, and protected routes. Auth pages use client-side forms with Zod validation, toast notifications for errors, and a guarded layout that redirects unauthenticated users.

**Database** — Supabase (Postgres) with migrations tracked in `supabase/migrations/`. Environment variables are validated at build time through `t3-env` + Zod, so you'll know about missing config before your users do.

**Error tracking** — Sentry integration with a local development mode. Set `SENTRY_LOCAL=true` and errors get stored in a local SQLite database instead of flying off to a remote service. Query them with `node src/lib/sentry-local-query.mjs recent`. No Sentry account needed during development.

**Testing** — Vitest for unit/integration tests, Playwright for E2E. Both are configured and have working examples. The CI pipeline runs lint, typecheck, and tests on every push and PR.

**Code quality** — Biome handles formatting and linting. Husky + lint-staged run checks on every commit. Conventional commit messages are enforced.

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 + React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind v4 |
| Components | shadcn/ui + Base UI primitives |
| Icons | Phosphor Icons |
| Auth | Better Auth |
| Database | Supabase (Postgres) |
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
# Fill in DATABASE_URL, BETTER_AUTH_SECRET, etc.

# Start developing
pnpm dev
```

## Using with fhhs-skills

This template is built to work with [fhhs-skills](https://github.com/cinjoff/fhhs-skills), a Claude Code plugin that provides skills for planning, building, reviewing, and shipping full-stack apps. The conventions in this repo — file structure, testing setup, planning artifacts — align with what fhhs-skills expects, so you get the best results when using them together.

## Project structure

```
src/
  app/
    (auth)/          Login, signup, forgot/reset password
    (app)/           Dashboard and authenticated pages
    api/             API routes (auth, Sentry local)
  components/        Shared React components (ui/ for shadcn)
  lib/               Utilities — auth config, env validation, Sentry local store
  tests/             Vitest tests
e2e/                 Playwright E2E tests
supabase/            Database migrations and seed data
```

**Route groups** keep concerns separated: `(auth)` handles the login flow, `(app)` enforces authentication at the layout level. No scattered auth checks across pages.

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

## Design decisions worth knowing

**Server components by default.** Client components (`'use client'`) are used only where interactivity requires them — forms, toasts, sign-out buttons. Everything else renders on the server.

**Zod everywhere data crosses a boundary.** Environment variables, form submissions, API inputs — all validated with Zod schemas. The `t3-env` integration means a missing env var fails the build, not a user request.

**Local-first error tracking.** The Sentry local mode stores events in SQLite during development. You can inspect errors without needing a Sentry account or internet connection. The same Sentry integration works with a real DSN in production.

## License

Private. See `package.json` for details.
