/**
 * Tests for src/lib/queries/members.ts
 *
 * DB tests are wrapped in describe.skipIf(!process.env.DATABASE_URL).
 */

import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { ConflictError } from "@/lib/api-errors";
import { closePool as closeFactoryPool, TestFactory } from "./factory";
import { loadEnv } from "./load-env";

// ---------------------------------------------------------------------------
// DB setup — mock @/lib/db so we don't need the Next.js runtime env
// ---------------------------------------------------------------------------

const envVars = loadEnv();
const DATABASE_URL = envVars.DATABASE_URL || process.env.DATABASE_URL;

if (DATABASE_URL && !process.env.DATABASE_URL) {
  process.env.DATABASE_URL = DATABASE_URL;
}

let testPool: Pool;

vi.mock("@/lib/db", () => ({
  getPool: () => testPool,
}));

// Import after mock is set up
const { listOrgMembers, countOwners, getMemberById, assertNotLastOwner } = await import(
  "@/lib/queries/members"
);

// ---------------------------------------------------------------------------
// DB tests
// ---------------------------------------------------------------------------

describe.skipIf(!DATABASE_URL)("members DB queries", () => {
  let factory: TestFactory;

  beforeAll(async () => {
    testPool = new Pool({ connectionString: DATABASE_URL });
    factory = new TestFactory();
  });

  afterAll(async () => {
    await factory.cleanup();
    await testPool.end();
    await closeFactoryPool();
  });

  describe("listOrgMembers", () => {
    it("returns members with user details and pagination", async () => {
      const owner = await factory.user().withOrg("members-list-org").asOwner().create();

      // Get orgId from DB
      const orgResult = await testPool.query<{ id: string }>(
        `SELECT id FROM organization WHERE slug = $1`,
        ["members-list-org"],
      );
      const orgId = orgResult.rows[0].id;

      const result = await listOrgMembers(orgId, 1, 10);

      expect(result.members.length).toBeGreaterThanOrEqual(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.per_page).toBe(10);
      expect(result.pagination.total).toBeGreaterThanOrEqual(1);

      const member = result.members.find((m) => m.userId === owner.id);
      expect(member).toBeDefined();
      expect(member?.userName).toBe(owner.name);
      expect(member?.userEmail).toBe(owner.email);
      expect(member?.role).toBe("owner");
      expect(member?.organizationId).toBe(orgId);
    });

    it("returns empty when page is beyond total", async () => {
      await factory.user().withOrg("members-list-page-org").asOwner().create(); // setup only

      const orgResult = await testPool.query<{ id: string }>(
        `SELECT id FROM organization WHERE slug = $1`,
        ["members-list-page-org"],
      );
      const orgId = orgResult.rows[0].id;

      const result = await listOrgMembers(orgId, 9999, 10);

      expect(result.members).toHaveLength(0);
      expect(result.pagination.page).toBe(9999);
    });
  });

  describe("countOwners", () => {
    it("returns correct owner count", async () => {
      await factory.user().withOrg("count-owners-org").asOwner().create();
      await factory
        .user()
        .withOrg("count-owners-org")
        .withEmail(`extra-owner-${Date.now()}@test.com`)
        .asOwner()
        .create();
      await factory
        .user()
        .withOrg("count-owners-org")
        .withEmail(`member-${Date.now()}@test.com`)
        .asMember()
        .create();

      const orgResult = await testPool.query<{ id: string }>(
        `SELECT id FROM organization WHERE slug = $1`,
        ["count-owners-org"],
      );
      const orgId = orgResult.rows[0].id;

      const count = await countOwners(orgId);

      expect(count).toBe(2);
    });

    it("returns 0 for an org with no owners", async () => {
      const org = await factory.org().withSlug("no-owners-org").withName("No Owners Org").create();

      const count = await countOwners(org.id);

      expect(count).toBe(0);
    });
  });

  describe("getMemberById", () => {
    it("returns member when it exists in the org", async () => {
      const owner = await factory.user().withOrg("get-member-org").asOwner().create();

      const orgResult = await testPool.query<{ id: string }>(
        `SELECT id FROM organization WHERE slug = $1`,
        ["get-member-org"],
      );
      const orgId = orgResult.rows[0].id;

      const memberResult = await testPool.query<{ id: string }>(
        `SELECT id FROM member WHERE "userId" = $1 AND "organizationId" = $2`,
        [owner.id, orgId],
      );
      const memberId = memberResult.rows[0].id;

      const member = await getMemberById(memberId, orgId);

      expect(member).not.toBeNull();
      expect(member?.id).toBe(memberId);
      expect(member?.userId).toBe(owner.id);
      expect(member?.userName).toBe(owner.name);
      expect(member?.userEmail).toBe(owner.email);
    });

    it("returns null for a non-existent member id", async () => {
      const org = await factory
        .org()
        .withSlug("get-member-null-org")
        .withName("Get Member Null Org")
        .create();

      const member = await getMemberById("nonexistent-member-id", org.id);

      expect(member).toBeNull();
    });

    it("returns null when member belongs to a different org", async () => {
      const owner = await factory.user().withOrg("get-member-wrong-org-a").asOwner().create();
      await factory.org().withSlug("get-member-wrong-org-b").withName("Wrong Org B").create();

      const orgAResult = await testPool.query<{ id: string }>(
        `SELECT id FROM organization WHERE slug = $1`,
        ["get-member-wrong-org-a"],
      );
      const orgAId = orgAResult.rows[0].id;

      const orgBResult = await testPool.query<{ id: string }>(
        `SELECT id FROM organization WHERE slug = $1`,
        ["get-member-wrong-org-b"],
      );
      const orgBId = orgBResult.rows[0].id;

      const memberResult = await testPool.query<{ id: string }>(
        `SELECT id FROM member WHERE "userId" = $1 AND "organizationId" = $2`,
        [owner.id, orgAId],
      );
      const memberId = memberResult.rows[0].id;

      // Look for memberId in wrong org
      const member = await getMemberById(memberId, orgBId);

      expect(member).toBeNull();
    });
  });

  describe("assertNotLastOwner", () => {
    it("throws ConflictError when member is the sole owner", async () => {
      const owner = await factory.user().withOrg("last-owner-org").asOwner().create();

      const orgResult = await testPool.query<{ id: string }>(
        `SELECT id FROM organization WHERE slug = $1`,
        ["last-owner-org"],
      );
      const orgId = orgResult.rows[0].id;

      const memberResult = await testPool.query<{ id: string }>(
        `SELECT id FROM member WHERE "userId" = $1 AND "organizationId" = $2`,
        [owner.id, orgId],
      );
      const memberId = memberResult.rows[0].id;

      await expect(assertNotLastOwner(memberId, orgId)).rejects.toThrow(ConflictError);
      await expect(assertNotLastOwner(memberId, orgId)).rejects.toThrow(
        "Cannot remove or demote the last owner",
      );
    });

    it("does not throw when multiple owners exist", async () => {
      await factory.user().withOrg("multi-owner-org").asOwner().create();
      const owner2 = await factory
        .user()
        .withOrg("multi-owner-org")
        .withEmail(`owner2-${Date.now()}@test.com`)
        .asOwner()
        .create();

      const orgResult = await testPool.query<{ id: string }>(
        `SELECT id FROM organization WHERE slug = $1`,
        ["multi-owner-org"],
      );
      const orgId = orgResult.rows[0].id;

      const memberResult = await testPool.query<{ id: string }>(
        `SELECT id FROM member WHERE "userId" = $1 AND "organizationId" = $2`,
        [owner2.id, orgId],
      );
      const memberId = memberResult.rows[0].id;

      await expect(assertNotLastOwner(memberId, orgId)).resolves.toBeUndefined();
    });

    it("does not throw when member is not an owner", async () => {
      const owner = await factory.user().withOrg("non-owner-assert-org").asOwner().create();
      const member = await factory
        .user()
        .withOrg("non-owner-assert-org")
        .withEmail(`regular-${Date.now()}@test.com`)
        .asMember()
        .create();

      const orgResult = await testPool.query<{ id: string }>(
        `SELECT id FROM organization WHERE slug = $1`,
        ["non-owner-assert-org"],
      );
      const orgId = orgResult.rows[0].id;

      const memberResult = await testPool.query<{ id: string }>(
        `SELECT id FROM member WHERE "userId" = $1 AND "organizationId" = $2`,
        [member.id, orgId],
      );
      const memberId = memberResult.rows[0].id;

      // Member is not an owner, so should not throw
      await expect(assertNotLastOwner(memberId, orgId)).resolves.toBeUndefined();

      // Verify owner is still there
      expect(owner.id).toBeDefined();
    });
  });
});
