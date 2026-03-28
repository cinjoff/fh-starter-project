# Roadmap

## Phase 01: Infrastructure Foundation (NOT STARTED)
**Goal:** Local Supabase dev environment and request-scoped tracing.
- Supabase config + setup script (OrbStack/Docker)
- Seed data: platform org, 2 tenants, 3 users, 2 customers
- AsyncLocalStorage trace_id propagation
- Remove SQLite fallback — Postgres required everywhere
- Package scripts: setup, db:start, db:stop, db:reset

## Phase 02: Core Patterns (COMPLETE)
**Goal:** Type system, RBAC, API response patterns, and auth wrappers.
- Domain types (Organization, Member, User, Customer)
- ApiResponse<T> envelope with trace_id
- 7 API error classes with typed codes
- ActionState discriminated union for server actions
- withAuth/withOrgAuth route wrappers
- Branded email template
- Unit + integration tests

## Phase 03: API Routes (NOT STARTED)
**Goal:** Organization and member CRUD as reference API examples.
- Typed query layer (organizations.ts, members.ts)
- 7 API endpoints: list/create orgs, list/invite/update/remove members
- RBAC enforcement with withOrgAuth
- Business logic: last-owner guard, self-invite rejection, conflict detection
- Rate limiting on invite endpoint (10 req/min)
- Integration tests against local Supabase

## Phase 04: User Management (COMPLETE)
**Goal:** Profile settings as reference server action implementation.
- updateProfile + changePassword server actions
- Zod validation at FormData boundary
- ActionState flow to client forms
- useActionState hook with loading/error/success states
- Integration tests for action logic

## Phase 05: Organizations Always-On (COMPLETE)
**Goal:** Remove feature flags, make organizations mandatory.
- Remove ENABLE_ORGANIZATIONS env vars
- Always load organization plugin
- Session always includes activeOrganizationId
- Org switcher component with dropdown
- Edge case handling (removed from org, no orgs)
- Component tests

## Phase 06: Test Excellence (COMPLETE)
**Goal:** Gold-standard testing patterns for derived projects.
- TestFactory with builder pattern and automatic cleanup
- 4 Page Object Models (Login, Settings, Org, Dashboard)
- Refactor existing E2E to use POMs
- New E2E specs: settings, member management
- Playwright global setup with connection verification
- Comprehensive coverage: auth, org, settings flows

## Phase 07: Dev Dashboard & Documentation (NOT STARTED)
**Goal:** Developer tooling and comprehensive documentation.
- /dev dashboard (dev-only, server component)
- Status cards: Supabase connection, seed data, org tree, recent logs
- Re-seed button with confirmation
- CLAUDE.md updates for all new patterns
- README updates with prerequisites and quick start
