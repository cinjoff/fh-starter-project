import { expect, type Page } from "@playwright/test";

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ---------------------------------------------------------------------------
  // Selectors
  // ---------------------------------------------------------------------------

  get heading() {
    return this.page.getByRole("heading", { name: "Sign in" });
  }

  get signUpHeading() {
    return this.page.getByRole("heading", { name: "Create account" });
  }

  get emailInput() {
    return this.page.getByLabel("Email address");
  }

  get passwordInput() {
    return this.page.getByLabel("Password");
  }

  get nameInput() {
    return this.page.getByLabel("Name");
  }

  get signInButton() {
    return this.page.getByRole("button", { name: "Sign In" });
  }

  get signUpButton() {
    return this.page.getByRole("button", { name: "Sign Up" });
  }

  get switchToSignUpButton() {
    return this.page.getByRole("button", { name: /sign up/i });
  }

  get switchToSignInButton() {
    return this.page.getByRole("button", { name: /sign in/i });
  }

  get forgotPasswordLink() {
    return this.page.getByRole("link", { name: /forgot password/i });
  }

  get verificationPrompt() {
    return this.page.getByTestId("verification-prompt");
  }

  get loginForm() {
    return this.page.getByTestId("login-form");
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  async goto() {
    await this.page.goto("/login");
  }

  async switchToSignUp() {
    await this.switchToSignUpButton.click();
  }

  async switchToSignIn() {
    await this.switchToSignInButton.click();
  }

  async signIn(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async signUp(name: string, email: string, password: string) {
    await this.switchToSignUp();
    await this.nameInput.fill(name);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signUpButton.click();
  }

  async clickForgotPassword() {
    await this.forgotPasswordLink.click();
  }

  // ---------------------------------------------------------------------------
  // Assertions
  // ---------------------------------------------------------------------------

  async expectSignInFormVisible() {
    await expect(this.heading).toBeVisible();
    await expect(this.loginForm).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.signInButton).toBeVisible();
  }

  async expectSignUpFormVisible() {
    await expect(this.signUpHeading).toBeVisible();
    await expect(this.nameInput).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.signUpButton).toBeVisible();
  }

  async expectVerificationPrompt() {
    await expect(this.verificationPrompt).toBeVisible({ timeout: 10_000 });
  }

  async expectRedirectedToLogin() {
    await expect(this.page).toHaveURL(/\/login/);
  }
}
