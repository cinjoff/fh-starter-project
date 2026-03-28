@AGENTS.md

# fh-starter-project

Production-ready Next.js starter template with auth, DB, error tracking, and testing.

## Tech Stack

Next.js 16 + React 19 + TypeScript, Tailwind v4, Shadcn/ui, Phosphor Icons, Supabase, Sentry, Zod, Biome, pnpm

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm test` | Run Vitest |
| `pnpm test:e2e` | Run Playwright |
| `pnpm check` | Biome lint + format check |
| `pnpm typecheck` | TypeScript type check |
| `pnpm format` | Biome auto-format (write mode) |

## Architecture

```
src/
  app/
    (auth)/      # Login, signup, forgot/reset password
    (app)/       # Authenticated pages — auth guard in layout.tsx
    (dev)/       # Dev-only route group — /dev health dashboard
    api/         # API routes
  lib/           # Shared utilities (supabase client, sentry-local, env, logger)
  components/    # React components (ui/ for shadcn)
  tests/         # Vitest tests
e2e/
  pages/         # Page Object Models
  fixtures.ts    # authedPage, testHelper fixtures
supabase/        # Migrations and seed data
```

## Domain Types

All shared types live in `src/lib/types.ts`:

- `Organization` — `{ id, name, slug, logo?, createdAt }`
- `Member` — `{ id, userId, organizationId, role, createdAt }` with `MemberRole = "owner" | "admin" | "member"`
- `User` — `{ id, email, name, emailVerified, image?, createdAt }`
- `Customer` — `{ id, organizationId, name, email, createdAt, updatedAt }`

## API Error Classes

`src/lib/api-errors.ts` exports typed error subclasses — throw these in route handlers; `withAuth`/`withOrgAuth` catch and serialize them automatically:

- `UnauthorizedError` (401), `ForbiddenError` (403), `NotFoundError` (404)
- `ConflictError` (409), `ValidationError` (422, takes `fieldErrors`)
- `BadGatewayError` (502), `ServiceUnavailableError` (503)
- `isApiError(err)` type guard for manual catch blocks

`src/lib/api-response.ts` exports the `ApiResponse<T>` discriminated union envelope plus `ok(data)` and `apiError(code, message)` helpers.

## Auth Wrappers

`src/lib/with-auth.ts` provides HOFs for route protection:

```ts
// User must be authenticated
export const GET = withAuth(async (req, ctx) => {
  // ctx: { user, session, traceId }
  return data;
});

// User must be authenticated AND a member of the org with minRole
export const POST = withOrgAuth("admin", async (req, ctx) => {
  // ctx: { user, session, traceId, org: { id }, member }
  return data;
});
```

Both wrappers serialize `ApiError` subclasses to the `ApiResponse` envelope automatically. Non-`ApiError` exceptions are rethrown.

## Server Actions

`src/lib/action-utils.ts` provides the `ActionState` discriminated union and helpers:

```ts
type ActionState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> };

// Parse and validate FormData with a Zod schema
const parsed = parseFormData(MySchema, formData);
if (!parsed.success) return parsed.state; // ActionState error

// Convenience constructors
return actionSuccess("Saved.");
return actionError("Failed.", { email: ["Already taken"] });
```

## Organizations

Always-on — every user belongs to at least one org. Key patterns:

- Active org is stored in `session.activeOrganizationId`
- `OrgSwitcher` component (`src/components/org-switcher.tsx`) — client component, reads org list via `authClient.organization.list()`, calls `authClient.organization.setActive()` on switch, then `router.refresh()`
- API routes scoped to an org use `withOrgAuth(minRole, handler)` — the `orgId` comes from the route param `[orgId]`

## Dev Dashboard

`/dev` route (`src/app/(dev)/dev/`) is a dev-only system health page. The `(dev)` layout guards access: redirects to `/dashboard` when `NODE_ENV !== "development"` and renders an amber banner so it's never mistaken for production.

Components (all server components, no client interactivity):
- `status-cards.tsx` — AuthModeCard, DatabaseCard, OrgCountCard (queries via `getPool()`)
- `recent-errors.tsx` — reads `.sentry-local/events.db` via `better-sqlite3`; graceful fallback when disabled or DB missing
- `org-tree.tsx` — organization/member hierarchy with role badges (queries via `getPool()`)

## Code Style

- Biome for formatting and linting — run `pnpm check` before committing
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Stage files individually, never `git add .`
- Server components by default; `'use client'` only when needed
- Zod schemas for all external data (API inputs, env vars, DB rows)
- Next.js 16: use `proxy.ts` (not middleware.ts), await `params`/`cookies()`/`headers()`

## Testing

- Vitest + React Testing Library in `src/tests/`, Playwright E2E in `e2e/`
- File convention: `*.test.ts(x)` for Vitest, `*.spec.ts` for Playwright
- Use `pnpm test --run` in CI/scripts to avoid watch mode hanging

## Planning

Project state tracked in `.planning/`. Run `/fh:progress` to check status.
Design tokens in `.planning/DESIGN.md` — run `/fh:ui-branding` to customize.

## Gotchas

- `shadcn` must be in `dependencies` (not devDependencies) — `globals.css` imports `shadcn/tailwind.css`
- Next.js 16 renamed middleware.ts to proxy.ts — read `node_modules/next/dist/docs/` for API changes
- Proxy (`src/proxy.ts`) only applies security headers — auth redirects are in `(app)/layout.tsx`
- OAuth callback validates `x-forwarded-host` against `NEXT_PUBLIC_APP_URL`
- Sentry local mode: `SENTRY_LOCAL=true` in .env.local, query with `node src/lib/sentry-local-query.mjs recent`

# Compact Instructions

When compacting, preserve:
- Current GSD phase and plan number from .planning/STATE.md
- All locked decisions from the active phase CONTEXT.md
- File paths modified so far in this session
- Test failures and their root causes
- Any requirements or constraints the user stated this session
