# fh-starter-project

Production-ready Next.js starter template with authentication, database, error tracking, and testing pre-configured.

## Features

- **Authentication** -- Supabase Auth with SSR cookie handling
- **Database** -- Supabase Postgres with migrations and seed data
- **Error Tracking** -- Sentry integration with local dev mode (SQLite fallback)
- **Testing** -- Vitest unit/component tests + Playwright E2E tests
- **CI** -- Automated linting, type checking, and test runs
- **Security Headers** -- Configured via Next.js proxy (CSP, HSTS, etc.)
- **Env Validation** -- Runtime-safe environment variables with Zod schemas
- **Release Automation** -- Conventional commits and versioned releases

## Tech Stack

Next.js 16, React 19, TypeScript, Tailwind v4, Shadcn/ui, Phosphor Icons, Supabase, Sentry, Zod, Biome, pnpm

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm (`corepack enable` to activate)

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd fh-starter-project

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your values (see Environment Variables below)

# Run the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

All variables are validated at runtime via `src/lib/env.ts` using Zod schemas.

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_APP_URL` | Public-facing app URL | `http://localhost:3000` | No |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | -- | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | -- | No |
| `SUPABASE_URL` | Supabase URL (server-side) | -- | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side) | -- | No |
| `SENTRY_DSN` | Sentry DSN (server-side) | -- | No |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN (client-side) | -- | No |
| `SENTRY_LOCAL` | Enable Sentry local SQLite mode | -- | No |
| `NEXT_PUBLIC_SENTRY_LOCAL` | Enable Sentry local mode (client-side) | -- | No |

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm test` | Run Vitest unit/component tests |
| `pnpm test:e2e` | Run Playwright E2E tests |
| `pnpm check` | Biome lint + format check |
| `pnpm typecheck` | TypeScript type check |
| `pnpm format` | Auto-fix lint and format issues |

## Project Structure

```
src/
  app/           # Next.js App Router (pages, layouts, API routes)
  lib/           # Shared utilities (Supabase client, Sentry, env validation)
  components/    # React components (ui/ for Shadcn components)
  tests/         # Vitest unit and component tests
e2e/             # Playwright E2E tests
supabase/        # Database migrations and seed data
```

## Deployment

This project uses the Vercel preset for Next.js. To deploy:

1. Push to your Git provider (GitHub, GitLab, etc.)
2. Import the project in [Vercel](https://vercel.com)
3. Set the following environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_APP_URL` -- your production domain
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` -- Supabase project credentials
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` -- server-side Supabase access
   - `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` -- Sentry error tracking
4. Deploy

## Extending

### Adding pages

Create new files in `src/app/`. Use the App Router file conventions (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`). Server components are the default; add `'use client'` only when you need browser APIs or interactivity.

### Adding API routes

Create `route.ts` files in `src/app/api/`. Next.js 16 uses the standard Web Request/Response API.

### Database migrations

Add SQL migration files in `supabase/migrations/`. Run `supabase db push` to apply locally or deploy via Supabase dashboard.

### Adding Shadcn components

```bash
pnpm dlx shadcn@latest add <component-name>
```

Components are installed to `src/components/ui/`.

## LLM/Agent Conventions

See [CLAUDE.md](./CLAUDE.md) for coding conventions, commit formats, and agent instructions used by AI assistants working on this codebase.
