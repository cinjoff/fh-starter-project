# Codebase Concerns

**Analysis Date:** 2026-03-27

## Tech Debt

**Unhandled Promise Rejections in Fire-and-Forget Email:**
- Issue: `sendEmail()` in `src/lib/email.ts` uses `.then().catch()` pattern without awaiting. If email send fails silently, errors are captured in Sentry but the promise chain may not be fully awaited by callers, risking unhandled rejections during auth flows.
- Files: `src/lib/email.ts` (lines 33-49), `src/lib/auth.ts` (lines 84-91, 95-101, 112-122)
- Impact: In high-traffic scenarios, unhandled promise rejections could accumulate in memory or cause server-side warnings.
- Fix approach: Convert `sendEmail()` to a void function or ensure all callers explicitly `.catch()` or await with timeout boundaries. Consider using `Sentry.startSpan()` wrapper for email operations.

**Silent Migration Failure in Local Auth Mode:**
- Issue: `src/lib/auth.ts` (lines 133-138) silently swallows migration errors on first startup with `.catch(() => {})`. If migrations fail due to disk space, permissions, or SQLite locks, tables won't exist but the error is hidden.
- Files: `src/lib/auth.ts` (lines 133-138)
- Impact: Application may crash on next startup with "no such table" errors, or auth routes may become completely broken during development.
- Fix approach: Log migration failures with `logger.warn()`, implement retry logic with exponential backoff, or fail fast in development mode.

**Type Casting in Sentry Configuration:**
- Issue: `sentry.server.config.ts` (line 22) uses `as Record<string, unknown>` for `transportOptions` due to type mismatch between Sentry's internal types and `createLocalSentryStore`.
- Files: `sentry.server.config.ts` (line 22)
- Impact: Type safety is bypassed; future Sentry SDK upgrades could break this pattern.
- Fix approach: Create a proper type interface or use `satisfies` operator instead of `as`.

**Pool Connection Not Explicitly Closed:**
- Issue: `src/lib/auth.ts` creates a `Pool` instance (line 28) but never calls `.end()` on shutdown. In production, this could lead to connection leaks if the application restarts or crashes.
- Files: `src/lib/auth.ts` (lines 27-29)
- Impact: Long-running apps may exhaust Postgres connection limits; graceful shutdown may hang.
- Fix approach: Register pool termination with Next.js shutdown hooks or use a singleton pattern with explicit cleanup.

## Known Bugs

**Race Condition in Sentry Local Event Pruning:**
- Symptoms: Pruning may occur concurrently with reads if multiple instances write events. No locking mechanism prevents race conditions.
- Files: `src/lib/sentry-local.ts` (lines 61-68)
- Trigger: High event volume (100+ events) under load.
- Workaround: Disable pruning by removing the automatic trigger (every 100 writes).

**Auth Callback Redirect Validation Gap:**
- Symptoms: `redirectTo` parameter in `src/app/(auth)/login/login-form.tsx` (lines 18-20) validates with simple `startsWith("/")` check but doesn't validate against absolute URLs on different hosts.
- Files: `src/app/(auth)/login/login-form.tsx` (lines 18-20)
- Trigger: User manually constructs a malicious redirect URL: `/login?redirect=//evil.com/phish`
- Workaround: Use strict URL parsing with `new URL()` and compare hostnames.

## Security Considerations

**Direct process.env Access Outside env.ts:**
- Risk: Multiple files access `process.env` directly instead of using validated `env` from `src/lib/env.ts`, bypassing Zod validation.
- Files: `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/layout.tsx`, `src/api/sentry-local/route.ts`, `src/proxy.ts`, `src/lib/auth-client.ts`
- Current mitigation: Env vars are mostly read-only at runtime.
- Recommendations: Consolidate all env access through `src/lib/env.ts` to ensure Zod validation and single source of truth.

**Sentry Local Mode DSN Validation:**
- Risk: `src/proxy.ts` (lines 9-13) silently ignores invalid `NEXT_PUBLIC_SENTRY_DSN` URLs without logging, allowing CSP to remain incomplete in edge cases.
- Files: `src/proxy.ts` (lines 9-13)
- Current mitigation: Invalid DSN just means Sentry origins aren't added to CSP `connect-src`.
- Recommendations: Log invalid DSN attempts; validate against URL format regex in build time.

**Email HTML Escaping Incomplete:**
- Risk: `escapeHtml()` in `src/lib/email.ts` covers common HTML entities but email clients may not respect all context. User-generated content in email templates could still be exploited.
- Files: `src/lib/email.ts` (lines 9-16)
- Current mitigation: Only admin-controlled HTML (password reset, invitations) is used; no user-generated content in templates.
- Recommendations: Use a dedicated email template engine with auto-escaping or consider plain-text emails.

**Tunnel Always Returns 200:**
- Risk: `src/app/api/sentry-local/route.ts` (line 83) always returns `{ ok: true }` even on error to avoid SDK crashes, but this masks real parsing issues.
- Files: `src/app/api/sentry-local/route.ts` (lines 81-84)
- Current mitigation: Errors are logged to console and won't break error tracking.
- Recommendations: Return 400+ status codes but document that Sentry SDK handles them gracefully.

## Performance Bottlenecks

**Synchronous Database Initialization:**
- Problem: `src/lib/sentry-local.ts` creates and initializes SQLite database synchronously in `getDb()` (lines 22-58), called on every Sentry event. Large files or slow disks could block event ingestion.
- Files: `src/lib/sentry-local.ts` (lines 22-58)
- Cause: Better-sqlite3 (synchronous) vs better-auth which manages its own pool.
- Improvement path: Lazy-load database once and reuse connection. Consider moving to async storage in future.

**No Query Optimization on Organization Lookup:**
- Problem: `src/lib/auth.ts` (line 56) runs a query `SELECT "organizationId" FROM "member"` for every session creation without caching or index verification.
- Files: `src/lib/auth.ts` (lines 54-72)
- Cause: Organizations may not be indexed; query can become O(n) with many members.
- Improvement path: Add explicit index: `CREATE INDEX IF NOT EXISTS idx_member_userid ON "member"("userId")`. Cache active org in session token.

**Email Send Timeout Not Configured:**
- Problem: Resend API calls have no timeout in `src/lib/email.ts` (lines 33-39). Slow network could hang for minutes.
- Files: `src/lib/email.ts` (lines 33-39)
- Cause: No timeout configuration passed to Resend client.
- Improvement path: Configure Resend client with `timeout: 5000` or use `Promise.race()` with a timeout wrapper.

## Fragile Areas

**Login Form Complex State Management:**
- Files: `src/app/(auth)/login/login-form.tsx`
- Why fragile: 243-line component manages multiple auth modes (sign-in, sign-up, email verification), email/password/name inputs, rate limiting feedback, and local auth banners. Changes to error handling or redirect logic are error-prone.
- Safe modification: Extract sub-components (`<SignUpForm>`, `<SignInForm>`, `<VerificationPrompt>`); use React Hook Form for validation state.
- Test coverage: Missing specific tests for rate limiting edge cases (429 errors), redirect parameter injection, and mode switching edge cases.

**Auth Enabled/Disabled Toggle:**
- Files: `src/lib/auth.ts` (lines 144-147)
- Why fragile: Global `authEnabled` boolean determines if entire app redirects to `/` (see `src/app/(app)/layout.tsx` line 8-10). If `auth` becomes null at runtime, protected pages fail without graceful degradation.
- Safe modification: Use a custom hook `useAuthStatus()` instead of module-level boolean; add fallback UI for "auth unavailable" state.
- Test coverage: No E2E tests for auth disabled scenario.

**Sentry Local Store Envelope Parsing:**
- Files: `src/lib/sentry-local.ts` (lines 85-167)
- Why fragile: Complex envelope format (positional line parsing, multiple item types). Invalid line breaks, missing items, or SDK version changes could silently drop events.
- Safe modification: Add comprehensive logging for parse failures; add schema validation with Zod.
- Test coverage: Only one test (`src/tests/sentry-local-tunnel.test.ts`). Missing tests for malformed envelopes, missing fields, and concurrent writes.

## Scaling Limits

**SQLite Single-Writer Bottleneck:**
- Current capacity: ~100-200 events/sec on local dev before lock contention.
- Limit: SQLite WAL mode (configured in `src/lib/sentry-local.ts` line 30) is single-writer. Concurrent Sentry writes will queue.
- Scaling path: Switch to Postgres when moving beyond local dev, or implement event batching on the client.

**Session Lookup Query Without Cursor Pagination:**
- Current capacity: All members fit in memory; organization query returns single row.
- Limit: If orgs have >10k members, session creation becomes N+1 (one query per session). No pagination or batching.
- Scaling path: Cache `userId → activeOrgId` mapping in Redis; implement organization session context on token.

**Email Rate Limiting at Provider Level:**
- Current capacity: Resend free tier allows 100/day; no queue or retry logic in `src/lib/email.ts`.
- Limit: If signup surge hits rate limit, emails silently fail (logged but not retried).
- Scaling path: Implement job queue (Bull, Inngest) for email retry logic; add backpressure to signup endpoint.

## Dependencies at Risk

**better-auth < 2.0:**
- Risk: Major breaking changes between 1.x and 2.0. CLAUDE.md references `next.js 16` API changes; better-auth frequently changes APIs.
- Impact: Upgrade could require rewriting `src/lib/auth.ts` and `src/lib/auth-client.ts`.
- Migration plan: Pin version in package.json, monitor release notes monthly. Create test suite for auth flows before upgrading.

**better-sqlite3 Native Addon:**
- Risk: Requires native compilation; fails on some architectures (ARM, Alpine Docker). Breaks in some serverless environments.
- Impact: Sentry local mode won't work on non-x86 machines or in production-like test environments.
- Migration plan: Use `better-sqlite3` only in dev; consider `sql.js` (in-memory) or Postgres for production.

**Resend Email Service Dependency:**
- Risk: If Resend API is down or rate-limited, all password resets and invitations fail silently.
- Impact: Users can't reset passwords or accept org invites; no error feedback to UI.
- Migration plan: Add fallback email provider (SendGrid) or implement retry queue with exponential backoff.

## Missing Critical Features

**No Audit Logging for Auth Events:**
- Problem: No record of login/logout/password reset attempts. Impossible to detect account takeover or brute force attacks.
- Blocks: Compliance requirements (HIPAA, SOC 2), security incident response.
- Implementation: Log to separate table or service with `Sentry.addBreadcrumb()` + dedicated audit log sink.

**No Token Refresh Invalidation on Logout:**
- Problem: `src/app/(app)/dashboard/sign-out-button.tsx` calls `authClient.signOut()` but browser may still have valid session cookie if pool is slow.
- Blocks: Distributed session invalidation; security in high-security environments.
- Implementation: Add server-side session revocation list or use JWT with short expiry.

**No Rate Limiting on Password Reset:**
- Problem: No guards against reset email spam in `src/lib/email.ts` callback.
- Blocks: Production deployment without additional WAF/middleware.
- Implementation: Add token bucketing on `userId` + `emailHash` with 5-minute cooldown.

## Test Coverage Gaps

**Authentication Flow E2E:**
- What's not tested: Signup with email verification, password reset with invalid/expired tokens, rate limiting response codes, redirect parameter validation.
- Files: `e2e/auth.spec.ts`
- Risk: Bugs in auth redirects or error handling surface only after production deployment.
- Priority: High — affects every user session.

**Organization Invite Acceptance:**
- What's not tested: Expired invitations (>7 days), double-acceptance, invitation with same email as member.
- Files: `src/app/(auth)/accept-invite/[id]/page.tsx` (107 lines, no unit tests)
- Risk: Silent failures in org setup flows.
- Priority: Medium — only used for multi-user orgs.

**Sentry Local Tunnel Edge Cases:**
- What's not tested: Malformed envelopes, missing required fields, concurrent writes, database lock timeout.
- Files: `src/lib/sentry-local.ts`, `src/tests/sentry-local-tunnel.test.ts`
- Risk: Dropped events or corrupted database in high-volume scenarios.
- Priority: Medium — only in dev, but blocks error investigation.

**Error Boundary Recovery:**
- What's not tested: Boundary doesn't reset state after "Try again" click; component may remain in error state.
- Files: `src/components/error-boundary.tsx`, `src/tests/error-boundary.test.tsx`
- Risk: Users forced to reload page after errors.
- Priority: Low — proper fix requires React 19 error recovery API.

---

*Concerns audit: 2026-03-27*
