import { deleteUserByEmail } from "./auth-test-helpers";
import { expect, test } from "./fixtures";
import { DashboardPage } from "./pages/dashboard.page";
import { LoginPage } from "./pages/login.page";

// ---------------------------------------------------------------------------
// Tests — UI rendering (no database required)
// ---------------------------------------------------------------------------

test.describe("Auth pages — UI rendering", () => {
  test("login page renders sign-in form", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.expectSignInFormVisible();
    await expect(loginPage.switchToSignUpButton).toBeVisible();
    await expect(loginPage.forgotPasswordLink).toBeVisible();
  });

  test("login page switches to sign-up mode", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.switchToSignUp();
    await loginPage.expectSignUpFormVisible();
    await expect(loginPage.switchToSignInButton).toBeVisible();
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
    const loginPage = new LoginPage(page);
    await page.goto("/dashboard");
    await loginPage.expectRedirectedToLogin();
  });
});

test.describe("Auth flows — sign up", () => {
  test("sign up shows verification prompt", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const email = `test+e2e-signup-${Date.now()}@example.com`;

    await loginPage.goto();
    await loginPage.signUp("E2E Signup User", email, "TestPassword123!");

    await loginPage.expectVerificationPrompt();
    // In local dev (no RESEND_API_KEY), email verification is automatic
    await expect(loginPage.verificationPrompt.getByRole("status")).toHaveText(
      "Account created! Email verification is automatic in local dev.",
    );

    // Clean up user created via the UI
    await deleteUserByEmail(email);
  });
});

test.describe("Auth flows — sign in", () => {
  test("authenticated user can access /dashboard", async ({ authedPage }) => {
    const dashboardPage = new DashboardPage(authedPage);
    await dashboardPage.goto();
    await expect(authedPage).toHaveURL(/\/dashboard/, { timeout: 10_000 });
  });
});

test.describe("Auth flows — sign out", () => {
  test("sign out redirects to /login", async ({ authedPage }) => {
    const dashboardPage = new DashboardPage(authedPage);
    await dashboardPage.goto();
    await expect(authedPage).toHaveURL(/\/dashboard/);

    await dashboardPage.signOut();

    await dashboardPage.expectSignedOut();
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
