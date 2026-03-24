# Phase 1 Plan Review — 2026-03-20

## Mode: HOLD SCOPE

## Changes Applied
1. **jiti relative path** — Use `./src/lib/env` not `@/lib/env` in next.config.ts (alias not resolved at config-load time)
2. **better-sqlite3 → devDependency** — Only used when SENTRY_LOCAL=true, avoids Vercel deploy bloat
3. **chmod +x .husky/pre-commit** — Explicit permission for Conductor worktrees
4. **Added error.tsx + global-error.tsx** — Next.js file-convention error boundaries for routes and root layout
5. **Lint conflict prevention** — Biome runs first in lint-staged, ESLint stripped to Next.js rules only
6. **ErrorBoundary 'use client'** — Emphasized in plan; componentDidCatch requires client component

## Error & Rescue Registry

| Codepath | Error Type | Rescued? | Rescue Action | User Sees |
|----------|-----------|----------|---------------|-----------|
| next.config.ts jiti | ModuleNotFoundError | Y | Use relative path ./src/lib/env | N/A (prevented) |
| t3-env validation | ZodError | Y | Prints missing var names | Clear error at build |
| lint-staged | LintConflict | Y | Biome first, ESLint Next.js-only | No conflicts |
| .husky/pre-commit | PermissionError | Y | chmod +x explicitly | N/A (prevented) |
| ErrorBoundary | SilentFailure (server) | Y | error.tsx + global-error.tsx cover server | Fallback UI |

## Failure Modes Registry

| Codepath | Failure Mode | Rescued? | Test? | User Sees? | Logged? |
|----------|-------------|----------|-------|------------|---------|
| Route component throws | Runtime error | Y (error.tsx) | Phase 4 | Error UI + reset | Y |
| Root layout throws | Runtime error | Y (global-error.tsx) | Phase 4 | Full-page error | Y |
| Client subtree throws | Runtime error | Y (ErrorBoundary) | Phase 4 | Error UI + reset | Y |
| Build with bad env | ZodError | Y (t3-env) | Phase 4 | Build fails with message | Y |
| Biome + ESLint conflict | Contradictory fixes | Y (separation) | Verify step | N/A (prevented) | N/A |

No CRITICAL GAPS remain.

## NOT in Scope
- Supabase client setup (Phase 2)
- Security headers in proxy.ts (Phase 3)
- Test examples (Phase 4)
- GitHub Actions CI (Phase 4)
- Source map uploads to Sentry (Phase 4 CI)

## What Already Exists
- Sentry local files (sentry-local.ts, sentry-local-query.mjs, API route, instrumentation files) — scaffolded in /new-project
- conductor.json, vercel.json — already committed
- globals.css, layout.tsx, eslint.config.mjs — plan modifies, not recreates

## Completion Summary

| Item | Status |
|------|--------|
| Mode | HOLD SCOPE |
| Architecture | Clean, no circular deps |
| Error paths | 5 mapped, 0 CRITICAL GAPS |
| Security | 2 items reviewed (env.example, better-sqlite3), resolved |
| Edge cases | 4 interaction cases mapped, all handled |
| Tests | Deferred to Phase 4, plan doesn't break testability |
| Reversibility | 5/5 |
| Debt introduced | None |
