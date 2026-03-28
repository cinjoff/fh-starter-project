/**
 * Factory integration tests.
 *
 * These tests hit a real local Supabase database.  They are conditionally
 * skipped when DATABASE_URL is absent from the environment or .env.local.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closePool, TestFactory } from "./factory";

// ---------------------------------------------------------------------------
// Detect DATABASE_URL the same way factory.ts does
// ---------------------------------------------------------------------------

function readEnvLocal(): string | undefined {
  const envPath = path.resolve(__dirname, "../../.env.local");
  if (!fs.existsSync(envPath)) return undefined;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx);
    if (key !== "DATABASE_URL") continue;
    let val = trimmed.slice(eqIdx + 1);
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    return val;
  }
  return undefined;
}

const dbUrl = process.env.DATABASE_URL ?? readEnvLocal();
const hasDb = Boolean(dbUrl);

// ---------------------------------------------------------------------------
// Helpers — query the DB directly to verify factory output
// ---------------------------------------------------------------------------

let pool: Pool;

beforeAll(() => {
  if (!hasDb) return;
  pool = new Pool({ connectionString: dbUrl });
});

afterAll(async () => {
  if (!hasDb) return;
  await pool.end();
  await closePool();
});

async function queryUser(id: string) {
  const result = await pool.query<{
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
  }>(`SELECT id, email, name, "emailVerified" FROM "user" WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}

async function queryOrg(id: string) {
  const result = await pool.query<{ id: string; name: string; slug: string }>(
    `SELECT id, name, slug FROM organization WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

async function queryMember(userId: string, orgId: string) {
  const result = await pool.query<{
    id: string;
    userId: string;
    organizationId: string;
    role: string;
  }>(
    `SELECT id, "userId", "organizationId", role FROM member WHERE "userId" = $1 AND "organizationId" = $2`,
    [userId, orgId],
  );
  return result.rows[0] ?? null;
}

async function queryAccount(userId: string) {
  const result = await pool.query<{ id: string; userId: string; providerId: string }>(
    `SELECT id, "userId", "providerId" FROM account WHERE "userId" = $1`,
    [userId],
  );
  return result.rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe.skipIf(!hasDb)("TestFactory integration", () => {
  it("creates a user with correct fields in the user table", async () => {
    const factory = new TestFactory();
    try {
      const user = await factory
        .user()
        .withEmail("factory-test-user@example.com")
        .withName("Factory User")
        .create();

      const row = await queryUser(user.id);
      expect(row).not.toBeNull();
      expect(row?.email).toBe("factory-test-user@example.com");
      expect(row?.name).toBe("Factory User");
      expect(row?.emailVerified).toBe(true);
    } finally {
      await factory.cleanup();
    }
  });

  it("creates a credential account record for the user", async () => {
    const factory = new TestFactory();
    try {
      const user = await factory.user().create();

      const account = await queryAccount(user.id);
      expect(account).not.toBeNull();
      expect(account?.userId).toBe(user.id);
      expect(account?.providerId).toBe("credential");
    } finally {
      await factory.cleanup();
    }
  });

  it("creates user, org, and member records when .withOrg().asAdmin() is used", async () => {
    const factory = new TestFactory();
    try {
      const user = await factory.user().withOrg("factory-test-org-admin").asAdmin().create();

      // User exists
      const userRow = await queryUser(user.id);
      expect(userRow).not.toBeNull();

      // Org exists
      const orgResult = await pool.query<{ id: string }>(
        `SELECT id FROM organization WHERE slug = $1`,
        ["factory-test-org-admin"],
      );
      expect(orgResult.rows).toHaveLength(1);
      const orgId = orgResult.rows[0].id;

      // Member record exists with correct role
      const member = await queryMember(user.id, orgId);
      expect(member).not.toBeNull();
      expect(member?.role).toBe("admin");
    } finally {
      await factory.cleanup();
    }
  });

  it("creates an org directly via OrgBuilder", async () => {
    const factory = new TestFactory();
    try {
      const org = await factory
        .org()
        .withName("Direct Org")
        .withSlug("direct-org-factory-test")
        .create();

      const row = await queryOrg(org.id);
      expect(row).not.toBeNull();
      expect(row?.name).toBe("Direct Org");
      expect(row?.slug).toBe("direct-org-factory-test");
    } finally {
      await factory.cleanup();
    }
  });

  it("generates deterministic IDs following the test-user-XXX-XXX pattern", async () => {
    const factory = new TestFactory();
    try {
      const user1 = await factory.user().create();
      const user2 = await factory.user().create();

      expect(user1.id).toMatch(/^test-user-\d{3}-\d{3}$/);
      expect(user2.id).toMatch(/^test-user-\d{3}-\d{3}$/);
      expect(user1.id).not.toBe(user2.id);
    } finally {
      await factory.cleanup();
    }
  });

  it("removes all created records after cleanup()", async () => {
    const factory = new TestFactory();
    const user = await factory.user().withOrg("cleanup-test-org").asOwner().create();

    const orgResult = await pool.query<{ id: string }>(
      `SELECT id FROM organization WHERE slug = $1`,
      ["cleanup-test-org"],
    );
    const orgId = orgResult.rows[0]?.id;

    // Verify records exist before cleanup
    expect(await queryUser(user.id)).not.toBeNull();
    expect(orgId).toBeDefined();
    // biome-ignore lint/style/noNonNullAssertion: orgId verified above
    expect(await queryMember(user.id, orgId!)).not.toBeNull();

    await factory.cleanup();

    // Verify records are gone
    expect(await queryUser(user.id)).toBeNull();
    // biome-ignore lint/style/noNonNullAssertion: orgId verified above
    const orgAfter = await queryOrg(orgId!);
    expect(orgAfter).toBeNull();
  });

  it("supports cross-org membership: two users in separate orgs", async () => {
    const factory = new TestFactory();
    try {
      const userA = await factory.user().withOrg("cross-org-a").asMember().create();
      const userB = await factory.user().withOrg("cross-org-b").asOwner().create();

      const orgAResult = await pool.query<{ id: string }>(
        `SELECT id FROM organization WHERE slug = $1`,
        ["cross-org-a"],
      );
      const orgBResult = await pool.query<{ id: string }>(
        `SELECT id FROM organization WHERE slug = $1`,
        ["cross-org-b"],
      );

      expect(orgAResult.rows).toHaveLength(1);
      expect(orgBResult.rows).toHaveLength(1);

      const orgAId = orgAResult.rows[0].id;
      const orgBId = orgBResult.rows[0].id;

      // Each user is only in their own org
      const memberA = await queryMember(userA.id, orgAId);
      const memberB = await queryMember(userB.id, orgBId);
      expect(memberA).not.toBeNull();
      expect(memberA?.role).toBe("member");
      expect(memberB).not.toBeNull();
      expect(memberB?.role).toBe("owner");

      // No cross-membership
      expect(await queryMember(userA.id, orgBId)).toBeNull();
      expect(await queryMember(userB.id, orgAId)).toBeNull();
    } finally {
      await factory.cleanup();
    }
  });

  it("TestFactory.run() creates records and cleans them up automatically", async () => {
    let capturedUserId: string | undefined;
    let capturedOrgSlug: string | undefined;

    await TestFactory.run(async (f) => {
      const user = await f.user().withOrg("run-helper-org").asMember().create();
      capturedUserId = user.id;
      capturedOrgSlug = "run-helper-org";

      // Records exist inside the callback
      const userRow = await queryUser(user.id);
      expect(userRow).not.toBeNull();
    });

    // Records are gone after TestFactory.run() returns
    // biome-ignore lint/style/noNonNullAssertion: set inside callback above
    expect(await queryUser(capturedUserId!)).toBeNull();
    const orgAfter = await pool.query<{ id: string }>(
      `SELECT id FROM organization WHERE slug = $1`,
      // biome-ignore lint/style/noNonNullAssertion: set inside callback above
      [capturedOrgSlug!],
    );
    expect(orgAfter.rows).toHaveLength(0);
  });
});
