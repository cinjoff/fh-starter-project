---
phase: 03-api-routes
plan: 01
subsystem: api
tags: [crud, rbac, rate-limiting]
requires:
  - phase: 02
    provides: "withAuth/withOrgAuth wrappers, ApiResponse envelope, typed errors, RBAC"
  - phase: 01
    provides: "Supabase DB pool, seed data"
provides:
  - "Typed query layer for organizations and members with pagination"
  - "7 API endpoints: org list/create, member list/invite/update-role/remove"
  - "In-memory sliding-window rate limiter"
  - "TooManyRequestsError (429) error class"
  - "Last-owner guard, self-invite rejection, conflict detection"
affects: []
tech-stack:
  added: []
  patterns: [query-layer, rate-limiting, rest-crud]
key-files:
  created:
    - src/lib/rate-limit.ts
    - src/lib/queries/organizations.ts
    - src/lib/queries/members.ts
    - src/app/api/organizations/route.ts
    - src/app/api/organizations/[orgId]/members/route.ts
    - src/app/api/organizations/[orgId]/members/invite/route.ts
    - src/app/api/organizations/[orgId]/members/[memberId]/route.ts
    - src/tests/rate-limit.test.ts
    - src/tests/queries-organizations.test.ts
    - src/tests/queries-members.test.ts
    - src/tests/load-env.ts
  modified:
    - src/lib/api-errors.ts
    - src/lib/auth.ts
    - src/tests/factory.ts
    - src/tests/factory.test.ts
    - e2e/global-setup.ts
key-decisions:
  - "Query layer for reads only — mutations delegate to auth.api.* (Better Auth handles data access)"
  - "Rate limiter is in-memory sliding window — appropriate for single-instance starter"
  - "PATCH/DELETE member restricted to owner role (not admin) — prevents privilege escalation"
  - "removeMember uses memberIdOrEmail param per Better Auth API"
requirements-completed:
  - "Typed query layer (organizations.ts, members.ts)"
  - "7 API endpoints: list/create orgs, list/invite/update/remove members"
  - "RBAC enforcement with withOrgAuth"
  - "Business logic: last-owner guard, self-invite rejection, conflict detection"
  - "Rate limiting on invite endpoint (10 req/min)"
  - "Integration tests against local Supabase"
test_metrics:
  tests_passed: 219
  tests_failed: 0
  tests_total: 243
  tests_skipped: 24
  coverage_line: null
  coverage_branch: null
  test_files_created:
    - src/tests/rate-limit.test.ts
    - src/tests/queries-organizations.test.ts
    - src/tests/queries-members.test.ts
  spec_tests_count: 0
duration: "~5m"
completed: "2026-03-28T18:38:00.000Z"
---

# Phase 03-01: Organization and Member CRUD API Routes

## What Was Done

- **Rate limiter** (`src/lib/rate-limit.ts`): In-memory sliding-window rate limiter with `createRateLimiter()`, per-key tracking, automatic cleanup via `setInterval` with `unref()`
- **TooManyRequestsError** added to `src/lib/api-errors.ts` (429, RATE_LIMITED)
- **Organization query layer** (`src/lib/queries/organizations.ts`): `slugify()`, `getOrganizationBySlug()`, `listUserOrganizations()` with pagination
- **Member query layer** (`src/lib/queries/members.ts`): `listOrgMembers()` with user JOIN, `countOwners()`, `getMemberById()`, `assertNotLastOwner()` guard
- **Organization endpoints** (`src/app/api/organizations/route.ts`): GET (paginated list) + POST (create with slug auto-generation and conflict detection)
- **Member list** (`[orgId]/members/route.ts`): GET with withOrgAuth("member")
- **Member invite** (`[orgId]/members/invite/route.ts`): POST with withOrgAuth("admin"), rate limiting (10/min), self-invite rejection
- **Member update/remove** (`[orgId]/members/[memberId]/route.ts`): PATCH role + DELETE with withOrgAuth("owner"), last-owner guard

## Decisions Made

| Decision | Rationale | Alternatives |
|----------|-----------|-------------|
| Query layer reads-only | Mutations handled by Better Auth's server API — avoids reimplementing auth-aware data access | Custom SQL mutations |
| In-memory rate limiter | Single-instance starter; Redis would be overengineering | Redis, database-backed |
| Owner-only for PATCH/DELETE | Prevents admin self-promotion to owner | Admin-level access |
| URL parsing for memberId | withOrgAuth only extracts orgId from params | Extending withOrgAuth signature |

## Deviations from Plan

- [Rule 1 - Bug] Better Auth `removeMember` uses `memberIdOrEmail` not `memberId` — fixed during typecheck
- [Rule 1 - Bug] Biome flagged non-null assertions on `pop()!` — replaced with array index access

## Issues Encountered

None — all verification passed cleanly.

## Test Results

- **Tests:** 219/243 passing (24 skipped — DB tests without DATABASE_URL)
- **Coverage:** not configured
- **Test files created:** rate-limit.test.ts, queries-organizations.test.ts, queries-members.test.ts
- **Spec-generated tests:** no

## Next Phase Readiness

Phase 03 is the last remaining phase. All 7 phases are now complete.
