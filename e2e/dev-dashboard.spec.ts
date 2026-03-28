import { expect, test } from "@playwright/test";

test.describe("Dev Dashboard", () => {
  test("renders dashboard with amber banner and status cards", async ({ page }) => {
    await page.goto("/dev");

    // Amber banner is visible
    await expect(page.getByText("Development Dashboard — not visible in production")).toBeVisible();

    // At least one status card renders
    await expect(page.getByText("Auth Mode")).toBeVisible();
    await expect(page.getByText("Database")).toBeVisible();

    // Recent errors section renders
    await expect(page.getByText("Recent Sentry Errors")).toBeVisible();

    // Org tree section renders
    await expect(page.getByText("Organization Tree")).toBeVisible();
  });
});
