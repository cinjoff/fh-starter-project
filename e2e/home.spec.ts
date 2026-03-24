import { expect, test } from "@playwright/test";

test("home page loads", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "fh-starter-project" })).toBeVisible();
  await expect(page.getByText("Production-ready Next.js starter template")).toBeVisible();
});

test("404 page shows for unknown routes", async ({ page }) => {
  await page.goto("/this-does-not-exist");

  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Go home" })).toBeVisible();
});
