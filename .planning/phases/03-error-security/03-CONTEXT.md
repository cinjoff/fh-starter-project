# Phase 3: Error Tracking and Security — Design Decisions

## Locked Decisions

### Security Headers
- Applied in `src/proxy.ts` after `updateSession()` returns
- Headers set on every response (including redirects)
- CSP is permissive: `'self'`, `'unsafe-inline'` for styles, allow Sentry + Supabase origins
- Full set: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy

### Sentry Integration
- Add `Sentry.captureException` to `error.tsx` and `global-error.tsx`
- Add `onRequestError` to `instrumentation.ts` for server-side capture
- Existing infrastructure (sentry-local, tunnel, CLI) is complete — no changes needed

### Error Pages Styling
- All error pages use Tailwind classes (not inline styles)
- `global-error.tsx` updated from inline styles to Tailwind
- `not-found.tsx` created with Tailwind, includes "Go home" link

## Deferred
- `withSentryConfig()` wrapper for next.config.ts (not needed until source maps upload)
- Sentry performance monitoring / tracing
