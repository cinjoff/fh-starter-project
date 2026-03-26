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
