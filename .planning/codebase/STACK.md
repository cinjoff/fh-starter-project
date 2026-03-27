# Technology Stack

**Analysis Date:** 2026-03-27

## Languages

**Primary:**
- TypeScript 5 - Application code, configuration, type-safe everything
- JavaScript (ES2017+) - Node.js scripts and PostCSS configuration

**Secondary:**
- CSS with Tailwind v4 - Styling and design system

## Runtime

**Environment:**
- Node.js (ES2017 target via Next.js 16)
- Next.js 16 (server and edge runtimes)

**Package Manager:**
- pnpm 10.26.2
- Lockfile: `pnpm-lock.yaml` (present)

## Frameworks

**Core:**
- Next.js 16.2.0 - Full-stack React framework with App Router
- React 19.2.4 - UI library
- React DOM 19.2.4 - DOM rendering

**UI & Styling:**
- Tailwind CSS 4 - Utility-first CSS framework (v4 with new @tailwindcss/postcss)
- Shadcn 4.1.0 - Component library (installed in dependencies, not devDependencies)
- Phosphor Icons 2.1.10 - Icon library
- Class Variance Authority 0.7.1 - Type-safe component variants
- clsx 2.1.1 - Utility for conditional classNames

**Authentication:**
- Better Auth 1.5.6 - Full-stack auth framework
- Better SQLite3 12.8.0 (dev) - Local SQLite for auth in development

**Data & Validation:**
- Zod 4.3.6 - Runtime schema validation
- @t3-oss/env-nextjs 0.13.10 - Type-safe environment variables

**Database:**
- pg 8.20.0 - PostgreSQL client for production
- Better SQLite3 12.8.0 (dev-only) - SQLite fallback for local development auth

**Email:**
- Resend 6.9.4 - Email delivery service client

**Observability:**
- @sentry/nextjs 10.45.0 - Error tracking and performance monitoring
- @sentry/core 10.45.0 - Core Sentry SDK (used for offline transport)

**Utilities:**
- date-fns 4.1.0 - Date manipulation
- next-themes 0.4.6 - Theme management
- tailwind-merge 3.5.0 - Tailwind class merging (prevents conflicts)
- tw-animate-css 1.4.0 - Tailwind animation utilities
- sonner 2.0.7 - Toast notifications

## Testing

**Unit & Integration Testing:**
- Vitest 4.1.0 - Test runner and framework
- @testing-library/react 16.3.2 - React component testing utilities
- @testing-library/jest-dom 6.9.1 - DOM assertions
- @vitejs/plugin-react 6.0.1 - Vitest React plugin
- happy-dom 20.8.7 - Lightweight DOM implementation for tests
- jsdom 29.0.0 - Alternative DOM implementation

**Coverage:**
- @vitest/coverage-v8 4.1.1 - V8 coverage provider
- Coverage reporters: `text` (console), `lcov` (files)

**E2E Testing:**
- @playwright/test 1.58.2 - Playwright browser testing framework
- Test location: `e2e/` directory

## Linting & Formatting

**Code Quality:**
- Biome 2.4.8 - Unified linter and formatter (replaces ESLint + Prettier)
- ESLint 9 - Legacy linter (included via eslint-config-next)
- eslint-config-next 16.2.0 - Next.js ESLint configuration

**Configuration:**
- `biome.json` - Biome configuration with 2-space indents, 100-char line width
- `.eslintrc` or eslint.config.mjs - ESLint configuration

## Build & Dev Tools

**Build:**
- Next.js native build system (integrated in `next build`)
- PostCSS 4 - CSS processing (configured via `postcss.config.mjs`)
- Tailwind CSS v4 with @tailwindcss/postcss plugin

**Type Checking:**
- TypeScript 5 - Compiler with strict mode enabled

**Development Utilities:**
- jiti 2.6.1 - Lightweight runtime code loader (used to validate env at build time)
- Husky 9.1.7 - Git hooks framework
- lint-staged 16.4.0 - Run linters on staged files

## Configuration Files

**Environment:**
- `.env.example` - Template for required environment variables
- `.env.local` (symlinked from workspace repo) - Local development secrets
- `src/lib/env.ts` - Type-safe environment schema via t3-env + Zod

**Build:**
- `next.config.ts` - Next.js configuration with Sentry wrapper
- `tsconfig.json` - TypeScript compiler options, path aliases `@/*` → `src/*`
- `biome.json` - Unified linting and formatting rules
- `postcss.config.mjs` - PostCSS configuration with Tailwind v4
- `vercel.json` - Vercel deployment configuration

**Testing:**
- `vitest.config.mts` - Vitest configuration (happy-dom environment)
- `playwright.config.ts` - Playwright configuration (Chromium, base URL: localhost:3000)

**Package Management:**
- `package.json` - Dependencies, scripts, lint-staged hooks
- `pnpm-lock.yaml` - Locked dependency versions

## Platform Requirements

**Development:**
- Node.js (LTS recommended, ES2017 compatible)
- pnpm 10+
- PostgreSQL (optional for local dev; SQLite fallback for auth)

**Production:**
- Node.js server (Next.js standalone or Vercel)
- PostgreSQL database
- Sentry account (optional for error tracking)
- Resend account (optional for email delivery)

## Security & Headers

**Sentry Configuration:**
- Configured via `sentry.server.config.ts` (server-side)
- Configured via `sentry.edge.config.ts` (edge runtime)
- Configured via Next.js `withSentryConfig()` wrapper in `next.config.ts`
- Support for offline local mode via SQLite (`SENTRY_LOCAL=true`)

**Content Security Policy:**
- Applied via `src/proxy.ts` (Next.js 16 proxy replaces middleware.ts)
- Dynamically includes Sentry DSN origin in `connect-src` directive

---

*Stack analysis: 2026-03-27*
