import { expect, type Page } from "@playwright/test";

export class SettingsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ---------------------------------------------------------------------------
  // Selectors
  // ---------------------------------------------------------------------------

  get heading() {
    return this.page.getByRole("heading", { name: "Settings" });
  }

  get profileHeading() {
    return this.page.getByText("Profile", { exact: true }).first();
  }

  get passwordHeading() {
    return this.page.getByText("Password", { exact: true }).first();
  }

  get nameInput() {
    return this.page.getByLabel("Name");
  }

  get currentPasswordInput() {
    return this.page.getByLabel("Current Password");
  }

  get newPasswordInput() {
    return this.page.getByLabel("New Password", { exact: true });
  }

  get confirmPasswordInput() {
    return this.page.getByLabel("Confirm New Password");
  }

  get saveChangesButton() {
    return this.page.getByRole("button", { name: "Save Changes" });
  }

  get updatePasswordButton() {
    return this.page.getByRole("button", { name: "Update Password" });
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  async goto() {
    await this.page.goto("/settings");
  }

  async updateName(name: string) {
    await this.nameInput.fill(name);
  }

  async changePassword(currentPassword: string, newPassword: string) {
    await this.currentPasswordInput.fill(currentPassword);
    await this.newPasswordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(newPassword);
  }

  async submitProfile() {
    await this.saveChangesButton.click();
  }

  async submitPassword() {
    await this.updatePasswordButton.click();
  }

  // ---------------------------------------------------------------------------
  // Assertions
  // ---------------------------------------------------------------------------

  async expectProfileFormVisible() {
    await expect(this.heading).toBeVisible();
    await expect(this.nameInput).toBeVisible();
    await expect(this.saveChangesButton).toBeVisible();
  }

  async expectSuccessToast(message: string) {
    await expect(this.page.getByText(message)).toBeVisible({ timeout: 10_000 });
  }

  async expectErrorMessage(text: string) {
    await expect(this.page.getByText(text)).toBeVisible();
  }
}
