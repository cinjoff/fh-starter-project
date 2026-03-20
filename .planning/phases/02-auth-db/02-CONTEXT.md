# Phase 2 Context — Design Decisions

## Locked Decisions

### Supabase Env Vars Stay Optional
- Supabase vars remain `z.string().optional()` in env.ts
- App works without Supabase configured — proxy and auth checks gracefully skip when vars are missing
- Supabase client factories return `null` when env vars are absent
- Protected layout redirects to login only when Supabase is configured; otherwise renders children

### Auth UI Uses Shadcn Components
- Login/signup pages use shadcn Input, Button, Field components
- Email/password auth via `useActionState` + server actions
- OAuth provider buttons (Google, GitHub) as secondary options
- Toast feedback via sonner for auth errors/success

### Route Groups Follow Research
- `(auth)/` group for login, signup (public pages)
- `(protected)/` group with layout-level auth guard
- `auth/callback/route.ts` for PKCE code exchange
- Home page (`/`) stays outside both groups (public landing)

### Zod Schemas in supabase directory
- `src/lib/supabase/schemas.ts` — Profile schema co-located with Supabase clients
- Hand-written to match migration columns (id, email, full_name, avatar_url, created_at, updated_at)
- Used for type-safe DB responses via `.parse()` on query results

### proxy.ts Pattern
- Named export `proxy` (not middleware) per Next.js 16
- Uses `updateSession()` helper from `src/lib/supabase/proxy.ts`
- Gracefully no-ops when Supabase env vars are missing
- Defense in depth: proxy handles session refresh, layout handles auth guard

## Deferred to Later Phases
- Email confirmation flow (auth/confirm route)
- Password reset flow
- Profile editing UI
- Avatar upload
