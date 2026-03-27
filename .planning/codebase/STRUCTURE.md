# Codebase Structure

**Analysis Date:** 2026-03-27

## Directory Layout

```
west-monroe/
├── src/                    # Application source code
│   ├── app/               # Next.js App Router (routes, layouts, API)
│   │   ├── (app)/         # Protected route group
│   │   │   ├── dashboard/ # User dashboard page
│   │   │   └── layout.tsx # Protected layout (auth enforcement)
│   │   ├── (auth)/        # Public auth route group
│   │   │   ├── login/     # Login/signup page
│   │   │   ├── forgot-password/
│   │   │   ├── reset-password/
│   │   │   ├── create-organization/
│   │   │   └── accept-invite/
│   │   ├── api/           # API routes
│   │   │   ├── auth/      # Better Auth handler
│   │   │   └── sentry-local/ # Sentry local tunnel
│   │   ├── layout.tsx     # Root layout (fonts, global providers)
│   │   ├── page.tsx       # Home page
│   │   ├── error.tsx      # Error boundary for routes
│   │   ├── global-error.tsx # Global error handler
│   │   ├── not-found.tsx  # 404 page
│   │   ├── robots.ts      # SEO robots.txt
│   │   ├── sitemap.ts     # SEO sitemap
│   │   └── globals.css    # Global styles (imports shadcn/tailwind.css)
│   ├── components/        # Reusable React components
│   │   ├── ui/            # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   └── sonner.tsx # Toast provider
│   │   ├── error-boundary.tsx # React error boundary
│   │   └── [form components]  # Auth form components (in page dirs)
│   ├── lib/               # Shared business logic & utilities
│   │   ├── auth.ts        # Better Auth server setup + types
│   │   ├── auth-client.ts # Better Auth React client
│   │   ├── env.ts         # Type-safe env vars (t3-env + Zod)
│   │   ├── logger.ts      # Structured logging → Sentry
│   │   ├── email.ts       # Email sending (Resend + fallback)
│   │   ├── sentry-local.ts   # SQLite Sentry event store
│   │   ├── sentry-local-query.mjs # CLI tool to query local events
│   │   ├── dates.ts       # Date utility functions
│   │   ├── utils.ts       # Misc utilities
│   │   └── [no other subdirs] # Flat structure
│   ├── tests/             # Vitest unit/integration tests
│   │   ├── setup.ts       # Vitest setup (global config)
│   │   ├── *.test.ts      # Test files (co-located with lib)
│   │   ├── *.test.tsx     # Component tests
│   │   └── [helpers]      # Test utilities
│   └── proxy.ts           # Next.js 16 proxy (security headers)
│
├── e2e/                   # Playwright E2E tests
│   ├── fixtures.ts        # Custom test fixtures (authedPage)
│   ├── auth-test-helpers.ts # Database helpers (deleteUserByEmail)
│   ├── auth.setup.ts      # Setup project (create test user)
│   ├── auth.spec.ts       # Auth flow tests
│   ├── home.spec.ts       # Home page tests
│   └── org.spec.ts        # Organization feature tests
│
├── supabase/              # Database migrations and seed data
│   ├── migrations/        # SQL migration files
│   └── seed.sql           # Initial seed data
│
├── public/                # Static assets (served at /)
│
├── .planning/             # GSD planning (gitignored)
│   ├── codebase/          # Architecture/quality docs (auto-generated)
│   ├── designs/           # Design artifacts
│   └── phases/            # Execution phase plans
│
├── .data/                 # Local development data (gitignored)
│   └── local-auth.db      # SQLite auth database (auto-created)
│
├── .sentry-local/         # Local Sentry events (gitignored)
│   └── events.db          # SQLite event store (auto-created)
│
├── instrumentation.ts     # Next.js hook: Sentry server setup
├── instrumentation-client.ts # Sentry client-side init
├── sentry.server.config.ts # Server Sentry config
├── sentry.edge.config.ts  # Edge Sentry config
├── next.config.ts         # Next.js config + Sentry wrapper
├── proxy.ts               # [see src/proxy.ts]
├── tsconfig.json          # TypeScript config
├── biome.json             # Biome (formatter/linter) config
├── vitest.config.mts      # Vitest unit test config
├── playwright.config.ts   # Playwright E2E test config
├── components.json        # shadcn CLI config
├── package.json           # Dependencies + scripts
├── pnpm-lock.yaml         # Lock file (pnpm)
│
└── [CI/deployment files]
    ├── .github/workflows/ # GitHub Actions
    ├── .husky/            # Git hooks (lint-staged)
    ├── vercel.json        # Vercel deployment config
    └── [release-please, conductor configs]
```

## Directory Purposes

**src/app/**
- Purpose: Next.js App Router pages and API routes
- Contains: Page files (.tsx), layouts, API handlers, error boundaries
- Nested file structure determines routes automatically

**src/app/(app)/**
- Purpose: Protected application routes (require authentication)
- Contains: Dashboard, user profile, settings, org pages
- Route group syntax `(app)` prevents URL path inclusion
- Auth enforced by `layout.tsx` in this group

**src/app/(auth)/**
- Purpose: Public authentication pages (sign in, sign up, password reset)
- Contains: Login form, forgot password, reset password, org invite accept
- Route group syntax `(auth)` prevents URL path inclusion
- No auth enforcement; accessible to all users

**src/app/api/**
- Purpose: Server-side API endpoints (REST, webhooks)
- Contains: Auth handlers (delegated to Better Auth), Sentry tunnel, any custom endpoints
- Pattern: Dynamic routes use `[...slug]` catch-all syntax

**src/components/**
- Purpose: Reusable React components (client or server)
- Contains: UI components (shadcn), form components, error boundary
- Sub-folder `ui/` reserved for shadcn-generated components
- Import path: `@/components/ui/button`

**src/lib/**
- Purpose: Non-component business logic and utilities
- Contains: Auth setup, env config, email sending, logging, data utilities
- Flat structure (no subdirectories) keeps imports short
- Import path: `@/lib/auth`, `@/lib/email`

**src/tests/**
- Purpose: Vitest unit and integration tests
- Contains: `.test.ts` files for lib code, `.test.tsx` for components
- Collocated with source (not in separate test directory)
- Setup file initializes test environment

**e2e/**
- Purpose: Playwright end-to-end tests
- Contains: `.spec.ts` files for user flows (auth, pages, features)
- Fixtures provide authenticated page context (`authedPage`)
- Helpers provide database operations (deleteUserByEmail)

**supabase/**
- Purpose: Database schema and migrations
- Contains: SQL migration files, seed data scripts
- Used in production (Postgres) and optionally in tests
- [Not fully documented here; see schema in migration files]

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root layout (fonts, global providers, error boundary)
- `src/app/page.tsx`: Home page (`/`)
- `src/app/(app)/layout.tsx`: Protected layout (session validation, auth redirect)
- `src/app/api/auth/[...all]/route.ts`: All auth endpoints (Better Auth handler)
- `instrumentation.ts`: Server startup hook (Sentry initialization)

**Configuration:**
- `src/lib/env.ts`: Type-safe environment variables (t3-env)
- `next.config.ts`: Next.js config + Sentry wrapper
- `tsconfig.json`: TypeScript paths (e.g., `@/` = `src/`)
- `biome.json`: Formatter/linter rules
- `vitest.config.mts`: Unit test runner config
- `playwright.config.ts`: E2E test runner config

**Core Logic:**
- `src/lib/auth.ts`: Better Auth instance (login, signup, orgs, plugins)
- `src/lib/auth-client.ts`: Better Auth React client (browser SDK)
- `src/lib/email.ts`: Email sending (Resend + dev fallback)
- `src/lib/logger.ts`: Structured logging to Sentry
- `src/lib/sentry-local.ts`: SQLite Sentry event store
- `src/proxy.ts`: Security headers (CSP, HSTS, etc.)

**Testing:**
- `src/tests/setup.ts`: Vitest global setup
- `src/tests/*.test.ts`: Unit/integration tests
- `e2e/fixtures.ts`: Playwright test fixtures
- `e2e/auth-test-helpers.ts`: Database helpers
- `e2e/auth.setup.ts`: Playwright setup (create test user)

## Naming Conventions

**Files:**
- Page components: `page.tsx` (lowercase, next.js convention)
- Layout components: `layout.tsx` (lowercase, next.js convention)
- API routes: `route.ts` (lowercase, next.js convention)
- Regular components: `PascalCase.tsx` (React component style)
- Server functions: `camelCase.ts` (utility/logic)
- Tests: `*.test.ts` (Vitest) or `*.spec.ts` (Playwright)

**Directories:**
- Route groups: `(groupName)` (lowercase, parentheses)
- Feature directories: `lowercase` (e.g., `dashboard/`, `auth/`)
- Component subdirectories: `lowercase` (e.g., `ui/`)

## Where to Add New Code

**New Feature:**
- Primary code: `src/app/[route]/page.tsx` or nested layout
- Forms/UI: `src/components/[feature-name].tsx` or inline in page
- Tests: `src/tests/[feature-name].test.tsx` (if component) or `e2e/[feature-name].spec.ts` (if flow)

**New Component/Module:**
- Implementation: `src/components/[name].tsx` (if reusable UI) or `src/lib/[name].ts` (if logic)
- Tests: `src/tests/[name].test.tsx` (Vitest) immediately after implementation
- shadcn components: Run `pnpm exec shadcn` to add, placed in `src/components/ui/`

**Utilities:**
- Shared helpers: `src/lib/[utility-name].ts` (flat structure, no subdirs)
- Date helpers: `src/lib/dates.ts`
- Type helpers: In the module they belong to (e.g., types in `auth.ts`)

**API Endpoints:**
- Auth: Already implemented; don't modify `src/app/api/auth/[...all]/route.ts`
- New endpoints: Create `src/app/api/[feature]/route.ts`
- Pattern: Export GET/POST/PUT/DELETE named functions
- Error handling: Wrap with try/catch, call `Sentry.captureException()`

**Tests:**
- Unit tests: `src/tests/[module].test.ts` (mirrors lib module)
- Component tests: `src/tests/[component].test.tsx`
- E2E tests: `e2e/[feature].spec.ts`
- Fixtures: Add to `e2e/fixtures.ts` (shared across all tests)

## Special Directories

**src/app/(app)/**
- Purpose: Protected routes (auth-enforced)
- Generated: No (hand-written)
- Committed: Yes (source code)

**src/app/(auth)/**
- Purpose: Public auth pages
- Generated: No (hand-written)
- Committed: Yes (source code)

**.data/**
- Purpose: Local SQLite auth database in development
- Generated: Yes (auto-created by Better Auth)
- Committed: No (in .gitignore)
- Location: `.data/local-auth.db` (only in local dev mode)

**.sentry-local/**
- Purpose: Local Sentry event store (development)
- Generated: Yes (auto-created by tunnel)
- Committed: No (in .gitignore)
- Location: `.sentry-local/events.db` (only when SENTRY_LOCAL=true)

**.planning/**
- Purpose: GSD codebase documentation and phase plans
- Generated: Yes (auto-generated by GSD tools)
- Committed: No (in .gitignore)
- Subdirs: `codebase/` (docs), `designs/` (Figma), `phases/` (execution plans)

**node_modules/**
- Purpose: Installed dependencies
- Generated: Yes (pnpm install)
- Committed: No (in .gitignore)

**.next/**
- Purpose: Next.js build cache and output
- Generated: Yes (pnpm build)
- Committed: No (in .gitignore)

## Import Path Aliases

Configured in `tsconfig.json`:

| Alias | Path | Usage |
|-------|------|-------|
| `@/` | `src/` | All relative imports (e.g., `@/lib/auth`, `@/components/ui/button`) |
| (none) | relative | Local imports within same directory (e.g., `./helper.ts`) |

## File Organization Summary

**By Feature (User-Facing):**
1. Pages and layouts in `src/app/`
2. Forms/components in `src/components/` or inline in page
3. Server logic in `src/lib/`
4. Tests alongside in `src/tests/`

**By Layer (Technical):**
1. Routes: `src/app/[feature]/page.tsx`
2. Components: `src/components/[feature].tsx`
3. Logic: `src/lib/[service].ts`
4. Tests: `src/tests/[module].test.ts`
5. E2E: `e2e/[flow].spec.ts`

**Build/Config:**
1. Config files: Root level (`next.config.ts`, `tsconfig.json`, etc.)
2. Instrumentation: Root level (`instrumentation.ts`, `sentry.*.config.ts`)
3. Public assets: `public/` directory
4. Type definitions: In-file (next to implementation)

---

*Structure analysis: 2026-03-27*
