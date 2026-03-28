import { expect, test } from "./fixtures";
import { SettingsPage } from "./pages/settings.page";

test.describe("Settings — profile", () => {
  test("settings page renders profile and password forms", async ({ authedPage }) => {
    const settings = new SettingsPage(authedPage);
    await settings.goto();

    await settings.expectProfileFormVisible();
    await expect(settings.passwordHeading).toBeVisible();
  });

  test("profile update shows success toast", async ({ authedPage }) => {
    const settings = new SettingsPage(authedPage);
    await settings.goto();

    await settings.updateName("E2E Test User");
    await settings.submitProfile();

    await settings.expectSuccessToast("Profile updated");
  });
});

test.describe("Settings — password", () => {
  test("password change shows success toast", async ({ authedPage }) => {
    const settings = new SettingsPage(authedPage);
    await settings.goto();

    // The test user's credentials are set in the auth setup fixture.
    // We use a known password from the test seed; the server validates it.
    await settings.changePassword("password", "NewPassword123!");
    await settings.submitPassword();

    await settings.expectSuccessToast("Password updated");
  });

  test("mismatched passwords shows error message", async ({ authedPage }) => {
    const settings = new SettingsPage(authedPage);
    await settings.goto();

    // Fill confirm password with a value that doesn't match new password
    await settings.currentPasswordInput.fill("password");
    await settings.newPasswordInput.fill("NewPassword123!");
    await settings.confirmPasswordInput.fill("DifferentPassword456!");
    await settings.submitPassword();

    await settings.expectErrorMessage("Passwords do not match");
  });
});
