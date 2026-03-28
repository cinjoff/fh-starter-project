# src/lib — Shared Utilities

## Observability

- Use `import { logger } from "@/lib/logger"` instead of `console.log` in application code
- Logger levels: `trace`, `debug`, `info`, `warn`, `error`, `fatal`
- Logger attrs must be `string | number | boolean` only — no objects, arrays, or undefined
- Set user context after auth: `Sentry.setUser({ id, email })` — clear on sign-out: `Sentry.setUser(null)`
- Add breadcrumbs for key user actions: `Sentry.addBreadcrumb({ category, message, level, data })`
- Wrap slow/critical operations with `Sentry.startSpan({ name, op }, callback)`
- Server actions: wrap with `Sentry.withServerActionInstrumentation(name, opts, fn)`
- `console.log` is acceptable only in `sentry-local` internals and test files
- Prefer "wide events" — one comprehensive log with all context over many fragmented logs

## Environment

- Env vars validated with Zod in `env.ts` — add new vars there, not ad-hoc `process.env` reads
- Server action FormData must be parsed with Zod before use (not `as string` casts)
