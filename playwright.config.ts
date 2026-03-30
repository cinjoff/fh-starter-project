import { defineConfig, devices } from "@playwright/test";
import { loadEnv } from "./e2e/auth-test-helpers";
import { TEST_DB_URL } from "./e2e/db-config";

// Use CONDUCTOR_PORT + 100 to avoid clashing with the running dev server,
// or fall back to 3100 when running outside Conductor.
const CONDUCTOR_PORT = Number(process.env.CONDUCTOR_PORT) || 0;
const TEST_PORT = CONDUCTOR_PORT ? CONDUCTOR_PORT + 100 : 3100;
const envVars = loadEnv();

export default defineConfig({
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html"], ["list"]],
  use: {
    baseURL: `http://localhost:${TEST_PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: `pnpm dev --port ${TEST_PORT}`,
    url: `http://localhost:${TEST_PORT}`,
    reuseExistingServer: false,
    env: {
      DATABASE_URL: TEST_DB_URL,
      BETTER_AUTH_SECRET: envVars.BETTER_AUTH_SECRET ?? "",
      BETTER_AUTH_URL: `http://localhost:${TEST_PORT}`,
      NEXT_PUBLIC_APP_URL: `http://localhost:${TEST_PORT}`,
    },
  },
});
