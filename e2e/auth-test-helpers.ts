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

export function loadEnv(): Record<string, string> {
  // Prefer .env.test (isolated test DB) over .env.local (dev)
  const candidates = [
    path.resolve(__dirname, "../.env.test"),
    path.resolve(__dirname, "../.env.local"),
  ];
  let content: string | null = null;
  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, "utf8");
      break;
    }
  }
  if (!content) {
    throw new Error("No .env.test or .env.local found — cannot load env vars for E2E setup");
  }
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

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || envVars.DATABASE_URL,
});

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

// ---------------------------------------------------------------------------
// Test user emails
// ---------------------------------------------------------------------------

export const E2E_USER_EMAIL = process.env.E2E_USER_EMAIL || "test+e2e@example.com";
export const E2E_USER2_EMAIL = process.env.E2E_USER2_EMAIL || "test+e2e-2@example.com";

// ---------------------------------------------------------------------------
// Seed organization — well-known org that test data targets.
// The ID is resolved dynamically because the org may already exist in the DB
// with a different ID (e.g. created via the app UI). Playwright compiles to
// CJS where re-exported `let` bindings are captured by value at import time,
// so we use a getter function instead of a static export.
// ---------------------------------------------------------------------------

let _seedOrgId = "00000000-0000-0000-0000-000000000001";
let _seedOrgResolved = false;

export const SEED_ORG_SLUG = "platform";

/** Returns the current resolved seed org ID. Safe in CJS — always reads the live value. */
export function getSeedOrgId(): string {
  return _seedOrgId;
}

/**
 * Ensure the well-known seed organization exists.
 * Handles cases where the slug already exists under a different ID.
 * Result is cached — safe to call multiple times without extra DB queries.
 */
export async function ensureSeedOrg(): Promise<string> {
  if (_seedOrgResolved) return _seedOrgId;

  const result = await pool.query("SELECT id FROM organization WHERE slug = $1", [SEED_ORG_SLUG]);
  if (result.rows.length > 0) {
    _seedOrgId = result.rows[0].id;
  } else {
    await pool.query(
      `INSERT INTO organization (id, name, slug, "createdAt")
       VALUES ($1, $2, $3, NOW())`,
      [_seedOrgId, "Platform", SEED_ORG_SLUG],
    );
  }

  _seedOrgResolved = true;
  return _seedOrgId;
}

// ---------------------------------------------------------------------------
// User helpers — idempotent, parallel-safe (handle duplicate key races)
// ---------------------------------------------------------------------------

/** Generic helper: create or reuse a user, ensure seed org membership. */
async function ensureUser(
  helpers: TestHelpers,
  email: string,
  name: string,
  orgRole: string,
): Promise<{ id: string; email: string }> {
  const result = await pool.query<{ id: string; email: string }>(
    'SELECT id, email FROM "user" WHERE email = $1',
    [email],
  );
  let user: { id: string; email: string };
  if (result.rows.length > 0) {
    user = result.rows[0];
  } else {
    const created = helpers.createUser({ email, name });
    try {
      await helpers.saveUser(created);
    } catch (err: unknown) {
      // Handle race condition: another parallel worker inserted the user first
      if (
        err instanceof Error &&
        err.message.includes("duplicate key value violates unique constraint")
      ) {
        const retry = await pool.query<{ id: string; email: string }>(
          'SELECT id, email FROM "user" WHERE email = $1',
          [email],
        );
        user = retry.rows[0];
        await ensureSeedOrg();
        await ensureOrgMembership(user.id, _seedOrgId, orgRole);
        return user;
      }
      throw err;
    }
    user = { id: created.id, email: created.email };
  }

  await ensureSeedOrg();
  await ensureOrgMembership(user.id, _seedOrgId, orgRole);

  return user;
}

/** Create the persistent E2E test user or return the existing one. */
export async function ensureTestUser(helpers: TestHelpers): Promise<{ id: string; email: string }> {
  return ensureUser(helpers, E2E_USER_EMAIL, "E2E Test User", "owner");
}

/** Create the second persistent E2E test user or return the existing one. */
export async function ensureTestUser2(
  helpers: TestHelpers,
): Promise<{ id: string; email: string }> {
  return ensureUser(helpers, E2E_USER2_EMAIL, "E2E Test User 2", "member");
}

// ---------------------------------------------------------------------------
// Organization membership helpers
// ---------------------------------------------------------------------------

/** Ensure a user is a member of the given organization (idempotent, parallel-safe). */
export async function ensureOrgMembership(
  userId: string,
  organizationId: string,
  role = "member",
): Promise<void> {
  const existing = await pool.query(
    `SELECT id FROM member WHERE "userId" = $1 AND "organizationId" = $2`,
    [userId, organizationId],
  );
  if (existing.rows.length > 0) return;

  try {
    await pool.query(
      `INSERT INTO member (id, "userId", "organizationId", role, "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, NOW())`,
      [userId, organizationId, role],
    );
  } catch (err: unknown) {
    // Handle race: another worker inserted between our check and insert
    if (err instanceof Error && err.message.includes("duplicate key")) return;
    throw err;
  }
}

/** Delete an organization by slug -- useful for cleaning up orgs created in tests. */
export async function deleteOrgBySlug(slug: string): Promise<void> {
  const result = await pool.query("SELECT id FROM organization WHERE slug = $1", [slug]);
  if (result.rows.length === 0) return;
  const orgId = result.rows[0].id;
  await pool.query('DELETE FROM customer WHERE "organizationId" = $1', [orgId]);
  await pool.query('DELETE FROM member WHERE "organizationId" = $1', [orgId]);
  await pool.query("DELETE FROM organization WHERE id = $1", [orgId]);
}
