import { expect, test } from "./fixtures";
import { DashboardPage } from "./pages/dashboard.page";

// Note: No member management UI exists yet. These tests cover the org switcher
// component which is the only org-related UI currently available.

test.describe("Org switcher", () => {
  test("org switcher is visible on dashboard", async ({ authedPage }) => {
    const dashboard = new DashboardPage(authedPage);
    await dashboard.goto();

    await expect(authedPage).toHaveURL(/\/dashboard/, { timeout: 10_000 });
    await expect(dashboard.orgSwitcherButton).toBeVisible();
  });

  test("org switcher displays current organization name", async ({ authedPage }) => {
    const dashboard = new DashboardPage(authedPage);
    await dashboard.goto();

    // The trigger label shows the active org name once loaded.
    // We assert that the switcher button is present and not stuck in "Loading…".
    const switcher = dashboard.orgSwitcherButton;
    await expect(switcher).toBeVisible();
    // After orgs load, the label changes from "Loading…" to the org name
    await expect(switcher).not.toHaveText("Loading…", { timeout: 10_000 });
  });

  test("org switcher dropdown opens on click", async ({ authedPage }) => {
    const dashboard = new DashboardPage(authedPage);
    await dashboard.goto();

    // Wait for orgs to finish loading before clicking
    await expect(dashboard.orgSwitcherButton).toBeEnabled({ timeout: 10_000 });
    await dashboard.orgSwitcherButton.click();

    // Dropdown should render at least the "Create organization" item
    await expect(authedPage.getByRole("menuitem", { name: /create organization/i })).toBeVisible({
      timeout: 5_000,
    });
  });
});
