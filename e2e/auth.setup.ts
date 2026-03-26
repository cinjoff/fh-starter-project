import { test as setup } from "@playwright/test";
import { ensureTestUser, getTestHelpers } from "./auth-test-helpers";

const authFile = ".auth/user.json";

setup("create authenticated session", async ({ page }) => {
  const testHelper = await getTestHelpers();
  const user = await ensureTestUser(testHelper);
  const cookies = await testHelper.getCookies({
    userId: user.id,
    domain: "localhost",
  });
  await page.context().addCookies(cookies);
  await page.goto("/dashboard");
  await page.context().storageState({ path: authFile });
});
