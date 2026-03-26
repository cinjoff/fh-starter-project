import { testAuth } from "./auth-test-helpers";
import { expect, test } from "./fixtures";

// ---------------------------------------------------------------------------
// Tests — Organization creation (requires running database + auth session)
// ---------------------------------------------------------------------------

test.describe("Organization flows — create org", () => {
  const orgSlug = `test-org-${Date.now()}`;
  const orgName = "Test Org";

  test("authenticated user can create an organization", async ({ authedPage }) => {
    await authedPage.goto("/create-organization");

    await expect(
      authedPage.getByRole("heading", { name: "Create your organization" }),
    ).toBeVisible();
    await expect(authedPage.getByTestId("create-organization-form")).toBeVisible();

    // Fill organization name and verify slug auto-generates
    const nameInput = authedPage.getByLabel("Organization name");
    const slugInput = authedPage.getByLabel("Organization slug");

    await nameInput.fill(orgName);
    await expect(slugInput).toHaveValue("test-org");

    // Override slug with unique value to avoid collisions
    await slugInput.fill(orgSlug);

    // Submit the form
    await authedPage.getByTestId("create-organization-submit").click();

    // Verify redirect to dashboard
    await expect(authedPage).toHaveURL(/\/dashboard/, { timeout: 10_000 });

    // Clean up: delete the organization from the database
    const ctx = await testAuth.$context;
    const db = ctx.options.database as import("pg").Pool;
    await db.query('DELETE FROM "organization" WHERE slug = $1', [orgSlug]);
  });
});

// ---------------------------------------------------------------------------
// Tests — Accept invite (error path — invalid invitation ID)
// ---------------------------------------------------------------------------

test.describe("Organization flows — accept invite", () => {
  test("invalid invitation ID shows error state", async ({ authedPage }) => {
    await authedPage.goto("/accept-invite/invalid-id-does-not-exist");

    // The page first shows a loading/accepting state, then transitions to error
    const errorMessage = authedPage.getByTestId("invite-error");
    await expect(errorMessage).toBeVisible({ timeout: 10_000 });

    // Verify the error heading renders
    await expect(
      authedPage.getByRole("heading", { name: "Unable to accept invitation" }),
    ).toBeVisible();
  });
});
