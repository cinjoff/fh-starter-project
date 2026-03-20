---
phase: 03-error-security
plan: 01
status: complete
started: 2026-03-20
completed: 2026-03-20
requirements-completed:
  - REQ-05
  - REQ-07
  - REQ-07a
---

# Phase 3 Plan 01: Error Tracking & Security Headers

## What Was Built

### Security Headers (src/proxy.ts)
- `applySecurityHeaders()` applied to every proxy response (including redirects)
- `getConnectSrcOrigins()` dynamically builds CSP connect-src from NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SENTRY_DSN
- Headers: HSTS, X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy, Permissions-Policy, CSP
- CSP allows `'self' 'unsafe-inline'` for both scripts and styles (Next.js hydration compatibility)

### Sentry Error Capture
- `src/app/error.tsx`: calls `Sentry.captureException(error)` in useEffect
- `src/app/global-error.tsx`: calls `Sentry.captureException(error)` in useEffect, converted from inline styles to Tailwind classes, imports globals.css
- `instrumentation.ts`: exports `onRequestError` with `Sentry.withScope` tagging routerKind, routePath, routeType, renderSource

### Custom 404 Page
- `src/app/not-found.tsx`: server component, centered Tailwind layout, "404" heading, message, Link to home

## Commits
- `6f88ba1` feat(03-01): add security headers in proxy.ts
- `399e75c` feat(03-01): add Sentry capture to error boundaries, not-found page, and onRequestError
- `304783c` fix(03-01): add unsafe-inline to script-src CSP for Next.js compatibility

## Verification
- `pnpm build` — pass
- `pnpm typecheck` — pass
- `pnpm check` — pass (1 pre-existing warning)
- All 5 artifact content markers verified via grep

## Issues Encountered
None.
