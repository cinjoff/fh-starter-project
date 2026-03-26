import { deleteUserByEmail } from "./auth-test-helpers";
import { expect, test } from "./fixtures";

// ---------------------------------------------------------------------------
// Tests — UI rendering (no database required)
// ---------------------------------------------------------------------------

test.describe("Auth pages — UI rendering", () => {
  test("login page renders sign-in form", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByTestId("login-form")).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
    await expect(page.getByRole("button", { name: /sign up/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /forgot password/i })).toBeVisible();
  });

  test("login page switches to sign-up mode", async ({ page }) => {
    await page.goto("/login");

    await page.getByRole("button", { name: /sign up/i }).click();

    await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign Up" })).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("forgot password page renders form", async ({ page }) => {
    await page.goto("/forgot-password");

    await expect(page.getByRole("heading", { name: "Reset password" })).toBeVisible();
    await expect(page.getByTestId("forgot-password-form")).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByRole("button", { name: "Send reset link" })).toBeVisible();
    await expect(page.getByRole("link", { name: /back to sign in/i })).toBeVisible();
  });

  test("reset password with invalid/missing token shows error", async ({ page }) => {
    await page.goto("/reset-password");

    await expect(page.getByRole("heading", { name: "Invalid link" })).toBeVisible();
    await expect(
      page.getByText("This password reset link is invalid or has expired."),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Request a new link" })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Tests — Auth flows (require running database + testUtils plugin)
// ---------------------------------------------------------------------------

test.describe("Auth flows — unauthenticated redirect", () => {
  test("unauthenticated user visiting /dashboard is redirected to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Auth flows — sign up", () => {
  test("sign up shows verification prompt", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /sign up/i }).click();

    const email = `test+e2e-signup-${Date.now()}@example.com`;
    await page.getByLabel("Name").fill("E2E Signup User");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password").fill("TestPassword123!");
    await page.getByRole("button", { name: "Sign Up" }).click();

    const prompt = page.getByTestId("verification-prompt");
    await expect(prompt).toBeVisible({ timeout: 10_000 });
    await expect(prompt.getByRole("status")).toHaveText(
      "Check your email to verify your account before signing in.",
    );

    // Clean up user created via the UI
    await deleteUserByEmail(email);
  });
});

test.describe("Auth flows — sign in", () => {
  test("authenticated user can access /dashboard", async ({ authedPage }) => {
    await authedPage.goto("/dashboard");
    await expect(authedPage).toHaveURL(/\/dashboard/, { timeout: 10_000 });
  });
});

test.describe("Auth flows — sign out", () => {
  test("sign out redirects to /login", async ({ authedPage }) => {
    await authedPage.goto("/dashboard");
    await expect(authedPage).toHaveURL(/\/dashboard/);

    await authedPage.getByRole("button", { name: /sign out/i }).click();

    await expect(authedPage).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});

test.describe("Auth flows — forgot password", () => {
  test("forgot password shows success message", async ({ page }) => {
    await page.goto("/forgot-password");

    await page.getByLabel("Email address").fill(`test+e2e-forgot-${Date.now()}@example.com`);
    await page.getByRole("button", { name: "Send reset link" }).click();

    const success = page.getByTestId("forgot-password-success");
    await expect(success).toBeVisible({ timeout: 10_000 });
    await expect(success.getByRole("status")).toHaveText(
      "If an account exists with that email, you'll receive a reset link.",
    );
  });
});
