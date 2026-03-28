---
phase: 02-core-patterns
plan: 01
subsystem: core-patterns
tags: [types, rbac, api, auth, email]
requires: []
provides:
  - "Type system with domain interfaces (Organization, Member, User, Customer)"
  - "ApiResponse<T> envelope with trace_id and pagination support"
  - "7 typed API error classes (401-503) with SCREAMING_SNAKE_CASE codes"
  - "ActionState discriminated union for React 19 useActionState"
  - "withAuth/withOrgAuth route wrappers with session validation and RBAC"
  - "Three-tier RBAC (owner > admin > member) with guards"
  - "Shared Postgres pool singleton (db.ts)"
  - "Branded table-based email template with XSS escaping"
affects: ["03-api-routes", "04-user-management", "05-organizations-always-on"]
tech-stack:
  added: []
  patterns: ["HOF route wrappers", "discriminated unions", "typed error hierarchy"]
key-files:
  created:
    - src/lib/trace.ts
    - src/lib/types.ts
    - src/lib/api-errors.ts
    - src/lib/api-response.ts
    - src/lib/action-utils.ts
    - src/lib/roles.ts
    - src/lib/with-auth.ts
    - src/lib/db.ts
    - src/lib/email-template.ts
    - src/tests/api-errors.test.ts
    - src/tests/api-response.test.ts
    - src/tests/action-utils.test.ts
    - src/tests/roles.test.ts
    - src/tests/with-auth.test.ts
    - src/tests/email-template.test.ts
  modified:
    - src/lib/auth.ts
key-decisions:
  - "Error codes use SCREAMING_SNAKE_CASE for consistency with HTTP conventions"
  - "withAuth/withOrgAuth are HOFs returning NextResponse — wraps route handlers"
  - "RBAC is three-tier (owner > admin > member) with numeric hierarchy comparison"
  - "Email template is pure function renderer with inline styles for email client compat"
  - "Domain types are plain TypeScript interfaces, not Zod schemas"
  - "Trace ID stub returns undefined — Phase 01 replaces with AsyncLocalStorage"
  - "db.ts pulled forward from Phase 03 for withOrgAuth membership queries"
requirements-completed:
  - "Domain types (Organization, Member, User, Customer)"
  - "ApiResponse<T> envelope with trace_id"
  - "7 API error classes with typed codes"
  - "ActionState discriminated union for server actions"
  - "withAuth/withOrgAuth route wrappers"
  - "Shared Postgres pool singleton (db.ts)"
  - "Branded email template"
  - "Unit + integration tests"
test_metrics:
  tests_passed: 160
  tests_failed: 0
  tests_total: 160
  coverage_line: null
  coverage_branch: null
  test_files_created:
    - src/tests/api-errors.test.ts
    - src/tests/api-response.test.ts
    - src/tests/action-utils.test.ts
    - src/tests/roles.test.ts
    - src/tests/with-auth.test.ts
    - src/tests/email-template.test.ts
  spec_tests_count: 0
duration: "~5min"
completed: 2026-03-28T06:37:00Z
---

## What Was Done

- **Trace stub** (`trace.ts`): Minimal `getTraceId()` returning `undefined` — Phase 01 replaces with AsyncLocalStorage
- **Domain types** (`types.ts`): Organization, Member, User, Customer interfaces + MemberRole union
- **API errors** (`api-errors.ts`): Base `ApiError` + 7 subclasses (Unauthorized, Forbidden, Validation, NotFound, Conflict, ServiceUnavailable, BadGateway) with `isApiError` type guard
- **API response** (`api-response.ts`): `ApiResponse<T>` discriminated union with `ok()` and `apiError()` helpers, pagination support
- **Action utils** (`action-utils.ts`): `ActionState` union (idle/success/error) with `parseFormData` Zod v4 integration
- **RBAC** (`roles.ts`): Three-tier hierarchy, `buildMemberContext`, `requireRole`, `hasRole`
- **Auth wrappers** (`with-auth.ts`): `withAuth` (session + ApiResponse envelope) and `withOrgAuth` (membership + role check)
- **Database** (`db.ts`): Shared Postgres `Pool` singleton from `env.DATABASE_URL`
- **Email template** (`email-template.ts`): Table-based HTML renderer with XSS escaping
- **Auth integration** (`auth.ts`): Updated all email callbacks to use `renderEmail`
- **Fixed** TypeScript error in `with-auth.test.ts` (`NextResponse` → `Response` type)

## Test Results

- **Tests:** 160/160 passing (13 test files)
- **Coverage:** not configured
- **Test files created:** 6 new test files covering all new modules
- **Spec-generated tests:** no — tests were pre-written with implementation

## Issues Encountered

- Minor TypeScript error: `with-auth.test.ts` referenced `NextResponse` type without import. Fixed by using `Response` (standard Web API type).

## Next Phase Readiness

- Phase 03 (API Routes) can now use `withAuth`/`withOrgAuth`, `ApiResponse<T>`, error classes, and `getPool()`
- Phase 04 (User Management) can now use `ActionState`, `parseFormData`, and auth wrappers
- Phase 05 (Organizations Always-On) can now use `roles.ts` and domain types
