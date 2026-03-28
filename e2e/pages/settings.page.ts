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
    return this.page.getByRole("heading", { name: "Profile" });
  }

  get passwordHeading() {
    return this.page.getByRole("heading", { name: "Password" });
  }

  get nameInput() {
    return this.page.getByLabel("Name");
  }

  get currentPasswordInput() {
    return this.page.getByLabel("Current Password");
  }

  get newPasswordInput() {
    return this.page.getByLabel("New Password");
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

  /**
   * Settings page only has a name field for profile (no email field in the current implementation).
   * This method is provided for forward compatibility if an email field is added.
   */
  async updateEmail(_email: string) {
    // Email update is not available in the current profile form.
    // The form only has a Name field. This is a no-op placeholder.
    throw new Error("Email update is not available in the current settings page.");
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
    await expect(this.profileHeading).toBeVisible();
    await expect(this.nameInput).toBeVisible();
    await expect(this.saveChangesButton).toBeVisible();
  }

  async expectSuccessToast(message?: string) {
    const toast = this.page.getByRole("status").filter({ hasText: message ?? "" });
    if (message) {
      await expect(toast).toBeVisible({ timeout: 5_000 });
    } else {
      // Sonner renders toasts — look for any visible toast element
      await expect(this.page.locator("[data-sonner-toast]")).toBeVisible({ timeout: 5_000 });
    }
  }

  async expectErrorMessage(text: string) {
    await expect(this.page.getByText(text)).toBeVisible();
  }
}
