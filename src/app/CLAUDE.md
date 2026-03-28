# src/app — Next.js App Router

- `(app)/` — authenticated routes, layout checks session and redirects to login
- `(auth)/` — unauthenticated routes (login page)
- `api/auth/[...all]/` — Better Auth catch-all handler
- `cookies()`, `headers()`, `params` are all async (must be awaited)
