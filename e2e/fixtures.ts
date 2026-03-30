import { test as base, type Page } from "@playwright/test";
import type { TestHelpers } from "better-auth/plugins";
import { ensureSeedOrg, getTestHelpers, pool } from "./auth-test-helpers";
import { AUTH_FILE, AUTH_FILE_2 } from "./db-config";

type AuthFixtures = {
  testHelper: TestHelpers;
  authedPage: Page;
  user2Page: Page;
};

type WorkerFixtures = {
  /** Resolved seed org ID — queried once per worker via ensureSeedOrg(). */
  seedOrgId: string;
};

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
    const context = await browser.newContext({ storageState: AUTH_FILE });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  user2Page: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: AUTH_FILE_2 });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from "@playwright/test";
