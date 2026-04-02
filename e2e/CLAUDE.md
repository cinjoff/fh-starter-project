# E2E Tests — Playwright

## Conventions

- Test files use `*.spec.ts` convention
- Page Object Models live in `e2e/pages/`
- Run with `pnpm test:e2e`
- Tests run against the dev server (`reuseExistingServer: true`)

## Auth Fixtures

Use role-specific fixtures from `fixtures.ts` — never log in via UI in tests. Auth sessions are created via API in `auth.setup.ts` and persisted to `.auth/*.json`.

## Access Control Tests Required

Every new protected page MUST have E2E tests for:
1. **Authorized user** can access the page and sees expected content
2. **Unauthorized role** gets redirected (e.g., regular member can't access admin pages)
3. **Unauthenticated user** gets redirected to login

Use role-specific page fixtures to test each path.

## Locator Preferences

Prefer in this order:
1. `getByRole` — most resilient to UI changes
2. `getByTestId` — for elements without semantic roles
3. `getByText` — last resort, breaks when display strings change

## Anti-Patterns

- **Never** use `.isVisible().catch(() => false)` — silently swallows real errors. Use `.or()` to compose locators, or `test.skip` with a precondition check.
- **Never** use `page.waitForTimeout()` — always wait for a specific condition (`waitForURL`, `toBeVisible`, `waitForResponse`).
- **Never** hardcode URLs with port numbers — use `baseURL` from config.

## Seed Data

All test data is pre-seeded. Never create users/orgs dynamically in tests. Use deterministic seed constants from `auth-test-helpers.ts`.
