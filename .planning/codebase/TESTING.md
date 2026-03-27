# Testing Patterns

**Analysis Date:** 2026-03-27

## Test Framework

**Runner:**
- Vitest 4.1.0
- Config: `vitest.config.mts`

**Assertion Library:**
- Node.js expect (built-in with Vitest)
- React Testing Library for component testing
- Playwright for E2E testing

**Test Environment:**
- happy-dom (lightweight DOM for unit/component tests)
- jsdom available as alternative (configured but not default)

**Run Commands:**
```bash
pnpm test              # Run all Vitest tests (watch mode)
pnpm test --run        # Run all tests once (CI mode)
pnpm test:watch        # Explicit watch mode
pnpm test:e2e          # Run Playwright E2E tests
pnpm check             # Biome lint + format check (use before commit)
```

## Test File Organization

**Location:**
- Unit/component tests: `src/tests/*.test.{ts,tsx}` (co-located in tests folder)
- E2E tests: `e2e/*.spec.ts` (separate directory)

**Naming:**
- Unit tests: `*.test.ts` or `*.test.tsx` suffix
- E2E tests: `*.spec.ts` suffix

**Structure:**
```
src/tests/
├── setup.ts                    # Vitest setup (imports jest-dom)
├── email.test.ts              # Unit tests for email module
├── logger.test.ts             # Unit tests for logger
├── error-boundary.test.tsx     # Component tests
├── env.test.ts                # Environment variable validation tests
├── proxy.test.ts              # Proxy/security header tests
└── sentry-local-tunnel.test.ts # Sentry local mode tests

e2e/
├── fixtures.ts                # Playwright test fixtures with auth
├── auth.setup.ts              # Auth setup for E2E tests
├── auth.spec.ts               # Auth flow E2E tests
├── home.spec.ts               # Home page E2E test
├── org.spec.ts                # Organization E2E tests
├── auth-test-helpers.ts       # Helper functions for auth tests
└── playwright.config.ts        # Playwright configuration
```

## Test Structure

**Vitest Suite Organization:**

```typescript
// src/tests/logger.test.ts pattern
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  logger: { ... },
  addBreadcrumb: vi.fn(),
}));

describe("logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe.each(levels)("%s", (level) => {
    it("calls Sentry.logger with message and attrs", () => {
      // Test implementation
    });
  });

  describe("graceful handling when Sentry is not initialized", () => {
    it("does not throw when methods are undefined", () => {
      // Test implementation
    });
  });
});
```

**Patterns:**
- Suites organized with `describe()` blocks
- Related tests grouped in nested `describe()` blocks
- Parameterized tests use `describe.each()` for testing multiple values (e.g., all logger levels)
- Setup via `beforeEach()` for clean state between tests
- Teardown via `afterEach()` for cleanup (e.g., `vi.restoreAllMocks()`)
- Assertions use `expect()` with matchers

**Example from `src/tests/logger.test.ts`:**
```typescript
describe.each(levels)("%s", (level) => {
  it("calls Sentry.logger with message and attrs", () => {
    const attrs = { userId: "u1", count: 42, active: true };
    logger[level]("test message", attrs);

    expect(sentryLogger[level]).toHaveBeenCalledWith("test message", attrs);
  });
});
```

## Mocking

**Framework:** Vitest's `vi` object

**Top-level Mocks:**
- Dependencies mocked before module import (before describe block)
- Example from `src/tests/email.test.ts`:
```typescript
vi.mock("resend", () => {
  const mockSend = vi.fn();
  return {
    Resend: vi.fn(() => ({ emails: { send: mockSend } })),
    __mockSend: mockSend,
  };
});

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  addBreadcrumb: vi.fn(),
  logger: {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
  },
}));
```

**Dynamic Module Reloading:**
- Use `vi.resetModules()` to clear module cache between tests
- Allows changing mocks for different test scenarios
- Pattern from `src/tests/email.test.ts`:
```typescript
it("calls Sentry.captureException on Resend error", async () => {
  vi.resetModules();
  vi.doMock("resend", () => ({ ... }));  // New mock
  const { sendEmail } = await import("@/lib/email");  // Fresh import
  // Test with new mock
});
```

**Spy Mocks:**
- `vi.spyOn()` to spy on methods without replacing them
- `vi.stubEnv()` to stub environment variables
- Example from `src/tests/error-boundary.test.tsx`:
```typescript
beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});
```

**What to Mock:**
- External services: Resend, Sentry, databases
- Environment variables via `vi.stubEnv()`
- Browser APIs when testing server code
- Module dependencies (auth, email, etc.)

**What NOT to Mock:**
- Core utilities that are simple and deterministic
- Date formatting utilities (test actual output)
- Zod schemas (validate real transformations)
- React Testing Library DOM queries (test real rendering)

## Fixtures and Factories

**Test Data:**

From `src/tests/email.test.ts`:
```typescript
// Mock setup
vi.mock("@/lib/env", () => ({
  env: {
    RESEND_API_KEY: undefined,
    EMAIL_FROM: "Test <noreply@test.com>",
  },
}));

// Test with specific data
await sendEmail({
  to: "user@example.com",
  subject: "Test",
  html: "<p>Hello</p>",
});
```

**Playwright Fixtures:**

From `e2e/fixtures.ts`:
```typescript
export const test = base.extend<AuthFixtures>({
  testHelper: async ({ browser: _browser }, use) => {
    const helpers = await getTestHelpers();
    await use(helpers);
  },

  authedPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: authFile });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});
```

**Auth Test Helpers:**

From `e2e/auth-test-helpers.ts`:
- `getTestHelpers()` - Gets Better Auth test utilities
- `ensureTestUser(testHelper)` - Creates or retrieves test user
- `deleteUserByEmail(email)` - Cleans up test users

**Location:**
- Vitest mocks: inline in test files (no separate fixtures directory)
- Playwright fixtures: `e2e/fixtures.ts` and `e2e/auth-test-helpers.ts`

## Coverage

**Requirements:** No enforced coverage targets

**View Coverage:**
```bash
pnpm test --coverage
```

**Reporter:** v8 provider configured in `vitest.config.mts`
- Formats: text (console) and lcov (HTML reports)

## Test Types

**Unit Tests:**
- Scope: Individual functions/utilities
- Approach: Mock dependencies, test pure functions
- Examples: `email.test.ts` (escapeHtml), `logger.test.ts` (log levels), `env.test.ts` (Zod transforms)
- Live in: `src/tests/`

**Component Tests:**
- Scope: React components in isolation
- Approach: Render with React Testing Library, interact and assert
- Example from `src/tests/error-boundary.test.tsx`:
```typescript
it("renders children when no error occurs", () => {
  render(
    <ErrorBoundary>
      <GoodChild />
    </ErrorBoundary>,
  );

  expect(screen.getByText("All good")).toBeInTheDocument();
});
```
- Live in: `src/tests/`

**Integration Tests:**
- Scope: Feature interactions (auth flows, security headers)
- Approach: Mock external services, test actual code paths
- Example from `src/tests/proxy.test.ts` - tests Next.js proxy security headers
- Live in: `src/tests/`

**E2E Tests:**
- Framework: Playwright 1.58.2
- Scope: Full user workflows via browser automation
- Setup: `e2e/auth.setup.ts` creates authenticated session
- Tests: UI rendering, auth flows, form submission, redirects
- Config: `playwright.config.ts`

**Example from `e2e/auth.spec.ts`:**
```typescript
test("authenticated user can access /dashboard", async ({ authedPage }) => {
  await authedPage.goto("/dashboard");
  await expect(authedPage).toHaveURL(/\/dashboard/, { timeout: 10_000 });
});
```

## Common Patterns

**Async Testing:**

Vitest pattern:
```typescript
// Tests marked async when using await
it("logs via logger in dev mode", async () => {
  const Sentry = await import("@sentry/nextjs");
  const { sendEmail } = await import("@/lib/email");

  await sendEmail({ to: "user@example.com", subject: "Test", html: "<p>Hello</p>" });

  expect(Sentry.logger.info).toHaveBeenCalledWith("Email sent (dev mode)", {
    to: "user@example.com",
    subject: "Test",
  });
});
```

Playwright pattern:
```typescript
test("sign up shows verification prompt", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /sign up/i }).click();

  const prompt = page.getByTestId("verification-prompt");
  await expect(prompt).toBeVisible({ timeout: 10_000 });
});
```

**Error Testing:**

From `src/tests/env.test.ts`:
```typescript
it("rejects a string shorter than 32 characters", () => {
  expect(() => betterAuthSecretSchema.parse("short")).toThrow();
});
```

**Conditional Test Grouping:**

From `src/tests/error-boundary.test.tsx`:
```typescript
describe("ErrorBoundary", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  // Test scenarios...
});
```

## CI/CD Considerations

**Command for CI:**
```bash
pnpm test --run       # Run tests once without watch
pnpm test:e2e         # Run E2E tests
```

**Environment:**
- Playwright retries 2x on CI (0 locally)
- Parallel workers: 1 on CI, auto on local dev
- Tests forbidden with `.only()` on CI

---

*Testing analysis: 2026-03-27*
