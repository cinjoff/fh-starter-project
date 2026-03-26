/**
 * Minimal Better Auth instance for E2E test setup.
 * Avoids importing src/lib/auth.ts which depends on @t3-oss/env-nextjs.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { betterAuth } from "better-auth";
import type { TestHelpers } from "better-auth/plugins";
import { organization, testUtils } from "better-auth/plugins";
import { Pool } from "pg";

function loadEnv(): Record<string, string> {
  const envPath = path.resolve(__dirname, "../.env.local");
  const content = fs.readFileSync(envPath, "utf8");
  const vars: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    let val = trimmed.slice(eqIdx + 1);
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    vars[trimmed.slice(0, eqIdx)] = val;
  }
  return vars;
}

const envVars = loadEnv();

const pool = new Pool({ connectionString: envVars.DATABASE_URL });

export const testAuth = betterAuth({
  secret: envVars.BETTER_AUTH_SECRET,
  baseURL: envVars.BETTER_AUTH_URL || "http://localhost:3000",
  database: pool,
  emailAndPassword: { enabled: true },
  plugins: [organization(), testUtils()],
});

let _helpers: TestHelpers | null = null;

export async function getTestHelpers(): Promise<TestHelpers> {
  if (!_helpers) {
    const ctx = await testAuth.$context;
    _helpers = ctx.test;
  }
  return _helpers;
}

/** Delete a user by email -- useful for cleaning up users created via the UI. */
export async function deleteUserByEmail(email: string): Promise<void> {
  await pool.query('DELETE FROM "user" WHERE email = $1', [email]);
}

const E2E_USER_EMAIL = process.env.E2E_USER_EMAIL || "test+e2e@example.com";

/** Create the persistent E2E test user or return the existing one. */
export async function ensureTestUser(helpers: TestHelpers): Promise<{ id: string; email: string }> {
  const result = await pool.query<{ id: string; email: string }>(
    'SELECT id, email FROM "user" WHERE email = $1',
    [E2E_USER_EMAIL],
  );
  if (result.rows.length > 0) {
    return result.rows[0];
  }
  const user = helpers.createUser({
    email: E2E_USER_EMAIL,
    name: "E2E Test User",
  });
  await helpers.saveUser(user);
  return { id: user.id, email: user.email };
}
