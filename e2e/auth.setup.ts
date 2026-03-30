import { test as setup } from "@playwright/test";
import {
  ensureTestUser,
  ensureTestUser2,
  getSeedOrgId,
  getTestHelpers,
  pool,
} from "./auth-test-helpers";
import { AUTH_FILE, AUTH_FILE_2 } from "./db-config";

/**
 * Set activeOrganizationId on all sessions for a user.
 * Better Auth's testUtils.getCookies() creates sessions that bypass the
 * databaseHooks from the real auth.ts — so we set activeOrganizationId
 * manually after session creation.
 */
async function setActiveOrgForUser(userId: string, orgId: string): Promise<void> {
  await pool.query(`UPDATE "session" SET "activeOrganizationId" = $1 WHERE "userId" = $2`, [
    orgId,
    userId,
  ]);
}

setup("create authenticated session", async ({ page }) => {
  const testHelper = await getTestHelpers();

  // Create or reuse the persistent test user (also ensures seed org + ownership)
  const user = await ensureTestUser(testHelper);

  const cookies = await testHelper.getCookies({
    userId: user.id,
    domain: "localhost",
  });
  await page.context().addCookies(cookies);

  // Set active org to the seed org (where demo data lives)
  await setActiveOrgForUser(user.id, getSeedOrgId());

  await page.goto("/dashboard");
  await page.context().storageState({ path: AUTH_FILE });
});

setup("create second authenticated session", async ({ page }) => {
  const testHelper = await getTestHelpers();

  // Ensure both users exist (both join the seed org automatically)
  await ensureTestUser(testHelper);
  const user2 = await ensureTestUser2(testHelper);

  const cookies = await testHelper.getCookies({
    userId: user2.id,
    domain: "localhost",
  });
  await page.context().addCookies(cookies);

  await setActiveOrgForUser(user2.id, getSeedOrgId());

  await page.goto("/dashboard");
  await page.context().storageState({ path: AUTH_FILE_2 });
});

setup.afterAll(async () => {
  await pool.end();
});
