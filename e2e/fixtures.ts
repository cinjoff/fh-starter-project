import { test as base, type Page } from "@playwright/test";
import type { TestHelpers } from "better-auth/plugins";
import { getTestHelpers } from "./auth-test-helpers";

const authFile = ".auth/user.json";

type AuthFixtures = {
  testHelper: TestHelpers;
  authedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  testHelper: async ({ browser: _browser }, use) => {
    const helpers = await getTestHelpers();
    await use(helpers);
  },

  authedPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: authFile });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from "@playwright/test";
