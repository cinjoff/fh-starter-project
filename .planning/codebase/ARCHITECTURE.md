# Architecture

**Analysis Date:** 2026-03-27

## Pattern Overview

**Overall:** Next.js App Router with server-side authentication, layered separation between UI, application logic, and infrastructure.

**Key Characteristics:**
- Server-first rendering with selective client components
- Type-safe environment configuration and data validation
- Built-in observability via Sentry with local development mode
- Authentication via Better Auth (Postgres + SQLite fallback)
- Edge security headers via proxy (Next.js 16 replacement for middleware.ts)

## Layers

**Proxy/Security Layer:**
- Purpose: Apply security headers and CSP to all requests
- Location: `src/proxy.ts`
- Contains: Security header middleware, CSP generation, Sentry origin allowlisting
- Depends on: Next.js request/response, environment variables
- Used by: All routes (applied via config.matcher)

**API/Auth Layer:**
- Purpose: Handle authentication endpoints and Sentry local tunnel
- Location: `src/app/api/`
- Contains: `auth/[...all]/route.ts` (Better Auth handler), `sentry-local/route.ts` (local error store)
- Depends on: Better Auth server, Sentry, database
- Used by: Client SDK, browsers, external auth calls

**Page/Route Layer:**
- Purpose: Page components and layout composition
- Location: `src/app/(app)/` (protected routes), `src/app/(auth)/` (public auth pages)
- Contains: Page components (`.tsx`), layout wrappers, auth-gated content
- Depends on: Auth middleware, components, client-side auth
- Used by: Browser navigation, Next.js router

**Layout/Protection Layer:**
- Purpose: Enforce authentication requirements and user context
- Location: `src/app/(app)/layout.tsx` (protected), `src/app/layout.tsx` (root)
- Contains: Session validation, Sentry user context, organization redirects
- Depends on: Auth server, headers/cookies middleware
- Used by: All child routes within group

**Component Layer:**
- Purpose: Reusable UI components and forms
- Location: `src/components/` (ui/ for shadcn, form components, boundaries)
- Contains: Client components (buttons, inputs, forms), error boundaries
- Depends on: React, client-side auth, toast notifications
- Used by: Pages, layouts, other components

**Library/Utility Layer:**
- Purpose: Shared business logic, configuration, integrations
- Location: `src/lib/`
- Contains: Auth setup, environment config, email, logging, Sentry local storage, utilities
- Depends on: External services (Better Auth, Resend, Sentry), database drivers
- Used by: All application layers

## Data Flow

**Authentication Flow:**

1. User submits email/password on `/login`
2. `LoginForm` component calls `authClient.signIn.email()` (client SDK)
3. SDK POSTs to `/api/auth/sign-in` (Better Auth handler in `src/app/api/auth/[...all]/route.ts`)
4. Better Auth validates credentials against Postgres/SQLite database
5. Server creates session cookie and returns response
6. Client redirects to dashboard (`/dashboard`)
7. Protected layout (`src/app/(app)/layout.tsx`) validates session via `auth.api.getSession()`
8. Session sets user context in Sentry: `Sentry.setUser({ id, email })`
9. Page renders with authenticated user data

**Error Tracking Flow:**

1. Error occurs in client or server code
2. Sentry SDK captures exception/breadcrumb
3. If `SENTRY_LOCAL=true`: Event sent to `/api/sentry-local` tunnel
4. Tunnel parses Sentry envelope format and stores in `.sentry-local/events.db` (SQLite)
5. If `SENTRY_DSN` set: Event sent directly to Sentry.io
6. `src/lib/sentry-local-query.mjs` queries local SQLite for development inspection
7. Root-level error boundary (`src/components/error-boundary.tsx`) catches React errors

**Email/Notification Flow:**

1. Auth event requires email (signup verification, password reset, org invite)
2. Better Auth calls email handler callback (configured in `src/lib/auth.ts`)
3. Handler calls `sendEmail()` from `src/lib/email.ts`
4. If `RESEND_API_KEY` set: Calls Resend API
5. If not: Logs to Sentry/logger for development
6. Errors captured via Sentry.captureException()

**Organization Flow (if enabled):**

1. User signs in, auth middleware checks `ENABLE_ORGANIZATIONS`
2. If enabled and user has no active org: redirects to `/create-organization`
3. User creates org, Better Auth plugin stores in database
4. Database hook (`databaseHooks.session.create.before`) enriches session with `activeOrganizationId`
5. Subsequent requests include org ID in session data
6. Layout validates org membership, org pages access org-scoped data

## State Management

**Authentication State:**
- Server-side: Session stored in HTTP-only cookies (managed by Better Auth)
- Client-side: `authClient` (better-auth React SDK) wraps browser API for checking auth status
- User context: Set in Sentry after auth: `Sentry.setUser({ id, email })`
- Cleared on sign-out: `Sentry.setUser(null)` before redirect

**UI State:**
- Local component state (React hooks) for forms, modals, loading states
- Toast notifications via Sonner (`import { toast } from "sonner"`)
- No global state library; lifted to layout/page level as needed

**Observability State:**
- Breadcrumbs accumulate in Sentry during request lifecycle
- Spans created for slow operations via `Sentry.startSpan()`
- Log attributes attached to breadcrumbs (Sentry.addBreadcrumb)

## Key Abstractions

**Session Type:**
- Purpose: Represents authenticated user and organization context
- Examples: `src/lib/auth.ts` (Session type exported)
- Pattern: Type inferred from `auth.$Infer.Session` (type-safe, auth-provider agnostic)
- Data: `{ user: { id, email, name }, session: { activeOrganizationId? } }`

**Auth Instance:**
- Purpose: Encapsulates authentication logic (login, signup, password reset, org management)
- Examples: `src/lib/auth.ts` (server instance), `src/lib/auth-client.ts` (client instance)
- Pattern: Better Auth factory with plugins (organization, testUtils in test mode, nextCookies)
- Modes: Postgres (production), SQLite (development fallback), null (no config)

**Sentry Store (Local):**
- Purpose: SQLite-backed offline event storage for development
- Examples: `src/lib/sentry-local.ts` (createLocalSentryStore), `src/app/api/sentry-local/route.ts` (tunnel)
- Pattern: Implements Sentry offline transport interface (push, shift, unshift)
- Data: Envelope format parsed into JSON fields, stored + indexed by timestamp

**Logger:**
- Purpose: Structured logging → Sentry breadcrumbs + logger levels
- Examples: `src/lib/logger.ts`
- Pattern: Thin wrapper around Sentry.logger with breadcrumb attachment
- Levels: trace, debug, info, warn, error, fatal

**Auth Client (Browser):**
- Purpose: React hooks + async methods for client-side auth operations
- Examples: `src/lib/auth-client.ts`
- Pattern: Factory from better-auth React plugin (organizationClient conditionally added)
- Usage: `authClient.signIn.email()`, `authClient.signUp.email()`, org methods

## Entry Points

**Server Entry Point - Root Layout:**
- Location: `src/app/layout.tsx`
- Triggers: All requests
- Responsibilities: Global font loading, metadata, error boundary, toast provider

**Protected Route Entry Point:**
- Location: `src/app/(app)/layout.tsx`
- Triggers: Requests to `/dashboard`, `/profile`, etc.
- Responsibilities: Session validation, auth redirect, user context setup, org validation

**Auth Page Entry Point:**
- Location: `src/app/(auth)/login/page.tsx` (and variants)
- Triggers: Unauthenticated user navigation to auth routes
- Responsibilities: Render public auth forms with client-side state management

**API Entry Point - Auth:**
- Location: `src/app/api/auth/[...all]/route.ts`
- Triggers: Client SDK calls, `POST /api/auth/*`, `GET /api/auth/*`
- Responsibilities: Delegate all auth operations to Better Auth handler

**API Entry Point - Observability:**
- Location: `src/app/api/sentry-local/route.ts`
- Triggers: Browser Sentry SDK POST (when `SENTRY_LOCAL=true`)
- Responsibilities: Parse Sentry envelope, store in SQLite, return 200 to SDK

**Build Entry Point:**
- Location: `next.config.ts`
- Triggers: `pnpm build`
- Responsibilities: Sentry source map config, environment validation (jiti), Next.js wrapping

**Instrumentation Entry Point:**
- Location: `instrumentation.ts`
- Triggers: Server startup
- Responsibilities: Load Sentry config based on runtime (nodejs/edge)

## Error Handling

**Strategy:** Multi-layer error capture with automatic escalation to Sentry.

**Patterns:**

**React Error Boundary:**
- Component: `src/components/error-boundary.tsx`
- Catches: Render errors, lifecycle errors
- Handling: Renders fallback UI, calls `Sentry.captureException()` with component stack
- Location: Wraps all children in `src/app/layout.tsx`

**Server-Side Try/Catch:**
- Pattern: Explicit try/catch in route handlers, server actions
- Examples: Email sending catches in `src/lib/email.ts`, tunnel parsing in `src/app/api/sentry-local/route.ts`
- Handling: Log via `logger.error()`, call `Sentry.captureException()`, return safe response

**Unhandled Request Errors:**
- Hook: `instrumentation.ts` exports `onRequestError = Sentry.captureRequestError`
- Handling: Automatic capture to Sentry (no explicit code needed)

**Client-Side Errors:**
- Sentry SDK captures uncaught exceptions and network errors
- Local mode: POSTs to `/api/sentry-local` tunnel
- Remote mode: Sends to Sentry.io
- Breadcrumbs added for user interactions (auth, navigation, clicks)

**Form Validation:**
- Pattern: Zod schemas on submission data
- Examples: Auth forms validate email, password length
- No explicit error boundary; handled via UI state + toast notifications

## Cross-Cutting Concerns

**Logging:**
- Import: `import { logger } from "@/lib/logger"`
- Pattern: Structured logging with string/number/boolean attributes only
- Output: Sentry breadcrumbs + Sentry logger (console visible in dev via consoleLoggingIntegration)
- Rules: Never use console.log in app code (except tests/sentry-local internals)

**Validation:**
- Pattern: Zod schemas for environment variables, API inputs, form data
- Examples: `src/lib/env.ts` (t3-env + Zod), form handlers validate before use
- Rule: Server action FormData parsed with Zod before `as string` casts

**Authentication:**
- Pattern: Better Auth handles credential validation, session management
- Server: `auth.api.getSession({ headers: await headers() })`
- Client: `authClient.signIn.email()` and variants
- Protection: Layout-level redirect if session missing or org not active

**Type Safety:**
- Pattern: TypeScript inference from runtime values
- Examples: Session type inferred from `auth.$Infer.Session`, Env type from t3-env
- Build-time validation: `next.config.ts` calls `jiti("./src/lib/env")` to catch env errors early

**CORS/Security:**
- CSP Headers: Applied in `src/proxy.ts` for all requests
- Sentry origin: Allowlisted in CSP via DSN origin extraction
- XSS Prevention: HTML escaping in emails (`src/lib/email.ts`)
- Rate Limiting: Enabled in Better Auth config

---

*Architecture analysis: 2026-03-27*
