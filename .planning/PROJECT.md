# fh-starter-project

## Vision

An opinionated, production-ready Next.js starter template that eliminates repetitive setup work. Ships with auth, database, error tracking, testing, security, and code quality tooling — all preconfigured with best practices so new projects start at full velocity.

## Target Users

- The template author (Konstantin) and any developer/LLM bootstrapping new projects
- Projects built from this template inherit established practices that are easy for both humans and AI agents to follow

## Problem

Every new project requires the same 2-3 days of boilerplate: auth, DB, error tracking, testing, linting, CI, security headers, env validation. This template reduces that to configuring a few `.env` vars.

## Scope — v1

**In:**
- Next.js 16 + React 19 + TypeScript + Tailwind v4 (pnpm)
- Shadcn/ui components (skeleton, dialog, table, sonner) + Phosphor Icons
- Supabase (auth + Postgres + minimal migration)
- Sentry error tracking (production DSN + local SQLite for dev)
- Zod validation + t3-env for environment variables
- Forms: react-hook-form + @hookform/resolvers + ActionState<T> type + SubmitButton
- Toasts: sonner (Toaster in root layout)
- URL state: nuqs
- Dates: date-fns + thin utility wrappers
- Error boundaries: error.tsx, global-error.tsx, not-found.tsx with Sentry integration
- Metadata: title template, OG/twitter defaults, metadataBase, robots.txt, sitemap.xml
- Vitest (unit/integration) + Playwright (E2E) with minimal examples
- Biome (formatting/linting) + Husky + lint-staged
- Security: CSP/HSTS headers via proxy.ts
- GitHub Actions CI (lint, typecheck, test)
- Release automation: release-please (auto-changelog, GitHub releases, version bumps)
- CHANGELOG.md in keepachangelog format
- conductor.json for Conductor workspace support
- Vercel deployment preset
- Comprehensive CLAUDE.md and documented code for LLM readability
- Working home screen with auth gate

**Out:**
- i18n, analytics, email, payments
- Example pages (shadcn skills generate patterns at build time)
- @tanstack/react-table, @tanstack/react-query (install when needed)
- Motion/animations (app-specific choice)
- Generic component wrappers (against shadcn philosophy)
- Custom design system (users run `/fh:teach-impeccable` on their project)

## Constraints

- Package manager: pnpm
- Next.js 16.2.0 (uses `proxy.ts` instead of `middleware.ts`, async request APIs)
- React 19.2 (server components by default)
- Tailwind CSS v4 (`@import "tailwindcss"` syntax)
- Must work with Conductor workspaces (worktree-safe)

## Success Criteria

1. Clone, configure `.env` vars, `pnpm install` → working app with auth, error tracking, and tests passing
2. Home screen renders with auth gate
3. `pnpm test` and `pnpm test:e2e` pass green
4. `pnpm build` succeeds without errors
5. LLM can read CLAUDE.md and understand all conventions immediately
