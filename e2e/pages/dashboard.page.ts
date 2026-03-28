import { expect, type Page } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ---------------------------------------------------------------------------
  // Selectors
  // ---------------------------------------------------------------------------

  get heading() {
    // Dashboard shows "Welcome, <email or name>"
    return this.page.getByRole("heading", { name: /Welcome,/ });
  }

  get signOutButton() {
    return this.page.getByRole("button", { name: /sign out/i });
  }

  get orgSwitcherButton() {
    return this.page.getByLabel("Switch organization");
  }

  get settingsLink() {
    return this.page.getByRole("link", { name: /settings/i });
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  async goto() {
    await this.page.goto("/dashboard");
  }

  async signOut() {
    await this.signOutButton.click();
  }

  async switchOrg(orgName: string) {
    await this.orgSwitcherButton.click();
    await this.page.getByRole("menuitem", { name: orgName }).click();
  }

  async navigateToSettings() {
    await this.settingsLink.click();
  }

  // ---------------------------------------------------------------------------
  // Assertions
  // ---------------------------------------------------------------------------

  async expectVisible() {
    await expect(this.page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
    await expect(this.heading).toBeVisible();
  }

  async expectOrgName(name: string) {
    // The OrgSwitcher trigger displays the active org name as its label
    await expect(this.page.getByText(name)).toBeVisible({ timeout: 5_000 });
  }

  async expectSignedOut() {
    await expect(this.page).toHaveURL(/\/login/, { timeout: 10_000 });
  }
}
