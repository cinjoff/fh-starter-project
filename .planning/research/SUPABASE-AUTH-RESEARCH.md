# Supabase Auth with Next.js 16 — Research

**Date:** 2026-03-20
**Packages:** `@supabase/ssr@^0.9.0`, `@supabase/supabase-js@^2.99.3`, `next@16.2.0`

---

## 1. File Structure

```
src/
  lib/
    supabase/
      server.ts          # createServerClient for Server Components, Route Handlers, Server Functions
      client.ts          # createBrowserClient for Client Components
      proxy.ts           # updateSession helper used by proxy.ts
  app/
    auth/
      callback/
        route.ts         # OAuth/magic-link code exchange endpoint
      confirm/
        route.ts         # (optional) email confirmation endpoint
    (auth)/              # route group for public auth pages
      login/
        page.tsx
      signup/
        page.tsx
    (protected)/         # route group for protected pages
      dashboard/
        page.tsx
      layout.tsx         # server-side auth check + redirect
proxy.ts                 # Next.js 16 proxy (replaces middleware.ts)
supabase/
  migrations/
    00001_create_profiles.sql
```

**No additional dependencies needed.** The project already has `@supabase/ssr@^0.9.0` and `@supabase/supabase-js@^2.99.3`. The env vars `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are already defined in `src/lib/env.ts`.

---

## 2. Browser Client (`src/lib/supabase/client.ts`)

Used in Client Components (`'use client'`). The browser client uses `document.cookie` automatically and is cached as a singleton.

```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Notes:**
- Singleton by default — safe to call `createClient()` multiple times; returns same instance.
- Handles token refresh and PKCE automatically.
- No cookie options needed for standard use.

---

## 3. Server Client (`src/lib/supabase/server.ts`)

Used in Server Components, Route Handlers, and Server Functions. This is where Next.js 16's async `cookies()` matters.

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()   // <-- MUST await in Next.js 16

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component (read-only context).
            // Safe to ignore if proxy.ts handles session refresh.
          }
        },
      },
    }
  )
}
```

### Key points about async cookies

- In Next.js 16, `cookies()` returns a Promise. You **must** `await` it.
- `createClient()` must therefore be `async` and callers must `await` it: `const supabase = await createClient()`.
- The `try/catch` in `setAll` is intentional: Server Components cannot set cookies (streaming has already started). The proxy handles token refresh, so this is safe.
- In Route Handlers and Server Functions, `setAll` works normally (response headers can still be set).

---

## 4. Proxy Session Refresh (`src/lib/supabase/proxy.ts` + `proxy.ts`)

### Why proxy.ts (not middleware.ts)

Next.js 16 renamed `middleware.ts` to `proxy.ts`. The exported function must be named `proxy` (not `middleware`). The `config.matcher` syntax is identical. The proxy runs on every matched request before rendering.

### Helper: `src/lib/supabase/proxy.ts`

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do NOT use supabase.auth.getSession() here.
  // getUser() sends a request to the Supabase Auth server every time
  // to revalidate the token. getSession() reads from local storage
  // and can return stale/tampered data.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/signup') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

### Root proxy: `proxy.ts` (at project root or `src/`)

```ts
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public assets (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### How session refresh works in proxy

1. Proxy intercepts every matched request.
2. `createServerClient` reads auth cookies from the request via `getAll`.
3. `supabase.auth.getUser()` validates the access token with the Supabase Auth server.
4. If the access token is expired but the refresh token is valid, `@supabase/ssr` automatically refreshes the session. The new tokens are written back via `setAll`, which:
   - Updates `request.cookies` (so downstream Server Components see fresh cookies).
   - Recreates `supabaseResponse` with updated `Set-Cookie` headers (so the browser stores new tokens).
5. If no user and the route is protected, redirects to `/login`.

### Critical detail: the `supabaseResponse` reassignment

The `setAll` callback **must** recreate `supabaseResponse = NextResponse.next({ request })` every time cookies change. This ensures the response carries the updated `Set-Cookie` headers. Returning a different `NextResponse` (e.g., one created earlier) will lose the refreshed cookies, causing sign-out loops.

---

## 5. Auth Callback Route (`src/app/auth/callback/route.ts`)

Handles the redirect from Supabase after OAuth sign-in or magic link click. Uses PKCE flow.

```ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/'

  // Prevent open redirect
  if (!next.startsWith('/')) {
    next = '/'
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Code exchange failed — redirect to error page
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
```

**Notes:**
- The `x-forwarded-host` check handles deployments behind a load balancer/CDN.
- The `next` parameter allows deep-linking back to the page the user was trying to visit.
- `exchangeCodeForSession` uses the PKCE code verifier stored in cookies by Supabase.

---

## 6. Protected Routes Pattern

### Option A: Server-side check in a layout (recommended)

```ts
// src/app/(protected)/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <>{children}</>
}
```

### Option B: Per-page check

```ts
// src/app/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <div>Welcome, {user.email}</div>
}
```

### Defense in depth

The project should use **both** proxy-level protection and layout/page-level checks:

1. **Proxy (`proxy.ts`)** — fast redirect before rendering starts. Handles session refresh.
2. **Layout/page check** — authoritative server-side check. Required because:
   - Server Functions (`'use server'`) bypass the proxy matcher if the route is excluded.
   - The proxy docs explicitly warn: "Always verify authentication and authorization inside each Server Function rather than relying on Proxy alone."

---

## 7. Supabase Migration: Profiles Table with RLS

### File: `supabase/migrations/00001_create_profiles.sql`

```sql
-- Create profiles table linked to auth.users
create table public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Policies
create policy "Users can view their own profile"
  on public.profiles for select
  using ((select auth.uid()) = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using ((select auth.uid()) = id);

-- Optional: allow public read of profiles (for user directories)
-- create policy "Public profiles are viewable by everyone"
--   on public.profiles for select
--   using (true);

-- Auto-create profile on signup via trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Auto-update updated_at
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.update_updated_at();
```

**Notes:**
- `on delete cascade` ensures the profile is removed when the auth user is deleted.
- `security definer` on the trigger function lets it insert into `profiles` even though RLS is enabled.
- `set search_path = ''` on the trigger function prevents search_path injection (Supabase security best practice).
- Uses `(select auth.uid())` instead of bare `auth.uid()` in policies for better query planning.

---

## 8. Pitfalls Specific to Next.js 16

### 8.1 proxy.ts, not middleware.ts

The file **must** be named `proxy.ts` and the exported function **must** be named `proxy` (or a default export). Using `middleware` as the function name will not work.

```diff
- export function middleware(request: NextRequest) {
+ export function proxy(request: NextRequest) {
```

### 8.2 `cookies()` is async

All calls to `cookies()` from `next/headers` must be awaited. This makes the Supabase server client factory (`createClient`) async:

```ts
// WRONG (Next.js 14 pattern)
export function createClient() {
  const cookieStore = cookies()  // returns Promise, not the store!
  // ...
}

// CORRECT (Next.js 16)
export async function createClient() {
  const cookieStore = await cookies()
  // ...
}
```

Every call site must also await: `const supabase = await createClient()`.

### 8.3 `headers()` is async

Same as cookies. If you need headers (e.g., for `x-forwarded-host`):

```ts
const headersList = await headers()
const host = headersList.get('x-forwarded-host')
```

### 8.4 `params` is async in Route Handlers

Route handler context params are now a Promise:

```ts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
}
```

### 8.5 Proxy does NOT use `cookies()` from `next/headers`

In the proxy, cookies come from `request.cookies` (the `NextRequest` object), not from `next/headers`. The `cookies()` function from `next/headers` is only for Server Components, Route Handlers, and Server Functions. This is a common source of confusion.

### 8.6 Server Functions bypass Proxy

From the Next.js 16 docs: "Server Functions are not separate routes in this chain. They are handled as POST requests to the route where they are used, so a Proxy matcher that excludes a path will also skip Server Function calls on that path."

This means you **cannot** rely solely on proxy for auth. Every Server Function that mutates data should independently verify the user:

```ts
'use server'
import { createClient } from '@/lib/supabase/server'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  // ... proceed with mutation
}
```

### 8.7 Do NOT use `getSession()` for auth checks

`supabase.auth.getSession()` reads the session from cookies without validating it against the server. It can return stale or tampered data. Always use `supabase.auth.getUser()` for security-critical checks. Reserve `getSession()` only for non-critical reads (e.g., showing a user's name in the UI where a stale value is acceptable).

### 8.8 Proxy runtime

Next.js 16 proxy defaults to the Node.js runtime (not Edge). The `runtime` config option is not available in proxy files. This is fine for Supabase auth since `@supabase/ssr` works in both runtimes.

---

## 9. Integration with Project's Existing `env.ts`

The project already defines Supabase env vars in `src/lib/env.ts` using `@t3-oss/env-nextjs`. For auth to work, these should be **required** (not optional):

```ts
// In src/lib/env.ts — change from optional to required when auth is enabled
client: {
  NEXT_PUBLIC_SUPABASE_URL: z.url(),           // was .optional()
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),   // was .optional()
},
```

The Supabase client files can import from env.ts for validated values:

```ts
import { env } from '@/lib/env'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { /* ... */ } }
  )
}
```

---

## 10. Summary: Implementation Checklist

1. **Create `src/lib/supabase/server.ts`** — async server client with `await cookies()`
2. **Create `src/lib/supabase/client.ts`** — browser client (singleton)
3. **Create `src/lib/supabase/proxy.ts`** — `updateSession()` helper
4. **Create `src/proxy.ts`** — root proxy file calling `updateSession()`, with matcher
5. **Create `src/app/auth/callback/route.ts`** — PKCE code exchange
6. **Create `src/app/(protected)/layout.tsx`** — server-side auth guard
7. **Create `supabase/migrations/00001_create_profiles.sql`** — profiles + RLS + trigger
8. **Update `src/lib/env.ts`** — make Supabase vars required
9. **No new dependencies needed** — `@supabase/ssr` and `@supabase/supabase-js` already installed

---

## Sources

- `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` (Next.js 16 proxy spec)
- `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/cookies.md` (async cookies API)
- `@supabase/ssr` package docs via Context7 (createServerClient, createBrowserClient APIs)
- Supabase official Next.js auth guide via Context7 (callback route, RLS migration, proxy pattern)
- Supabase docs: "creating-a-client.mdx", "oauth_pkce_flow.mdx" (code exchange, session management)
