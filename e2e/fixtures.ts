import { type Browser, test as base, type Page } from "@playwright/test";
import type { TestHelpers } from "better-auth/plugins";
import {
  ensureSeedOrg,
  ensureTestUser,
  ensureTestUser2,
  getTestHelpers,
  pool,
} from "./auth-test-helpers";

type AuthFixtures = {
  testHelper: TestHelpers;
  authedPage: Page;
  user2Page: Page;
};

type WorkerFixtures = {
  /** Resolved seed org ID — queried once per worker via ensureSeedOrg(). */
  seedOrgId: string;
};

/**
 * Create a fresh browser context with a new session for the given user.
 * Each test gets its own session so sign-out in one test doesn't affect others.
 */
async function createAuthedContext(
  browser: Browser,
  helpers: TestHelpers,
  user: { id: string },
  orgId: string,
) {
  const cookies = await helpers.getCookies({ userId: user.id, domain: "localhost" });
  const context = await browser.newContext();
  await context.addCookies(cookies);

  // Set active org on the newly created session
  await pool.query(
    `UPDATE "session" SET "activeOrganizationId" = $1 WHERE "userId" = $2 AND "activeOrganizationId" IS NULL`,
    [orgId, user.id],
  );

  return context;
}

export const test = base.extend<AuthFixtures, WorkerFixtures>({
  seedOrgId: [
    async ({ browser: _browser }, use) => {
      const resolvedId = await ensureSeedOrg();
      await use(resolvedId);
      await pool.end();
    },
    { scope: "worker" },
  ],

  testHelper: async ({ browser: _browser }, use) => {
    const helpers = await getTestHelpers();
    await use(helpers);
  },

  authedPage: async ({ browser }, use) => {
    const helpers = await getTestHelpers();
    const user = await ensureTestUser(helpers);
    const orgId = await ensureSeedOrg();
    const context = await createAuthedContext(browser, helpers, user, orgId);
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  user2Page: async ({ browser }, use) => {
    const helpers = await getTestHelpers();
    const user = await ensureTestUser2(helpers);
    const orgId = await ensureSeedOrg();
    const context = await createAuthedContext(browser, helpers, user, orgId);
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from "@playwright/test";
