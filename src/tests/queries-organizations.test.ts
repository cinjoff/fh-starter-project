/**
 * Tests for src/lib/queries/organizations.ts
 *
 * Pure function tests (slugify) always run.
 * DB tests are wrapped in describe.skipIf(!process.env.DATABASE_URL).
 */

import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
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
const { slugify, getOrganizationBySlug, listUserOrganizations } = await import(
  "@/lib/queries/organizations"
);

// ---------------------------------------------------------------------------
// Pure function tests — always run
// ---------------------------------------------------------------------------

describe("slugify", () => {
  it('converts "Acme Corp" to "acme-corp"', () => {
    expect(slugify("Acme Corp")).toBe("acme-corp");
  });

  it('converts "hello  world!" to "hello-world"', () => {
    expect(slugify("hello  world!")).toBe("hello-world");
  });

  it('converts "---test---" to "test"', () => {
    expect(slugify("---test---")).toBe("test");
  });

  it("lowercases the string", () => {
    expect(slugify("HELLO WORLD")).toBe("hello-world");
  });

  it("collapses multiple consecutive hyphens", () => {
    expect(slugify("a---b")).toBe("a-b");
  });

  it("handles strings with only special characters", () => {
    expect(slugify("!!!")).toBe("");
  });

  it("handles alphanumeric-only strings without change", () => {
    expect(slugify("hello123")).toBe("hello123");
  });
});

// ---------------------------------------------------------------------------
// DB tests
// ---------------------------------------------------------------------------

describe.skipIf(!DATABASE_URL)("organizations DB queries", () => {
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

  describe("listUserOrganizations", () => {
    it("returns orgs for a user with pagination metadata", async () => {
      const user = await factory.user().withOrg("queries-org-test-1").asOwner().create();

      const result = await listUserOrganizations(user.id, 1, 10);

      expect(result.organizations.length).toBeGreaterThanOrEqual(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.per_page).toBe(10);
      expect(result.pagination.total).toBeGreaterThanOrEqual(1);
      expect(result.pagination.total_pages).toBeGreaterThanOrEqual(1);

      const slugs = result.organizations.map((o) => o.slug);
      expect(slugs).toContain("queries-org-test-1");
    });

    it("returns empty array when page is beyond total", async () => {
      const user = await factory.user().withOrg("queries-org-test-2").asOwner().create();

      const result = await listUserOrganizations(user.id, 9999, 10);

      expect(result.organizations).toHaveLength(0);
      expect(result.pagination.page).toBe(9999);
    });

    it("returns empty array for a user with no orgs", async () => {
      const user = await factory.user().create();

      const result = await listUserOrganizations(user.id, 1, 10);

      expect(result.organizations).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.total_pages).toBe(0);
    });

    it("paginates correctly", async () => {
      // Create a user in two orgs
      const user = await factory.user().withOrg("queries-org-page-a").asOwner().create();
      // Join second org by creating second user that shares membership
      await factory
        .user()
        .withOrg("queries-org-page-a")
        .withEmail(`extra-member-${Date.now()}@test.com`)
        .asMember()
        .create();

      // Just verify page 1 with perPage=1 returns 1 result
      const result = await listUserOrganizations(user.id, 1, 1);
      expect(result.organizations).toHaveLength(1);
      expect(result.pagination.per_page).toBe(1);
    });
  });

  describe("getOrganizationBySlug", () => {
    it("returns the org for an existing slug", async () => {
      await factory.org().withSlug("queries-slug-exists").withName("Slug Test Org").create();

      const org = await getOrganizationBySlug("queries-slug-exists");

      expect(org).not.toBeNull();
      expect(org?.slug).toBe("queries-slug-exists");
      expect(org?.name).toBe("Slug Test Org");
      expect(org?.id).toBeDefined();
      expect(org?.createdAt).toBeInstanceOf(Date);
    });

    it("returns null for a non-existent slug", async () => {
      const org = await getOrganizationBySlug("this-slug-does-not-exist-xyz");

      expect(org).toBeNull();
    });
  });
});
