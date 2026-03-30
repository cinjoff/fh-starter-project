import { hashPassword } from "better-auth/crypto";
import pg from "pg";

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

async function main() {
  const pool = new pg.Pool({ connectionString: DATABASE_URL });

  try {
    // ---------------------------------------------------------------------------
    // Better Auth core tables
    // ---------------------------------------------------------------------------
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        id                TEXT PRIMARY KEY,
        name              TEXT,
        email             TEXT UNIQUE,
        "emailVerified"   BOOLEAN,
        image             TEXT,
        "createdAt"       TIMESTAMP,
        "updatedAt"       TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "account" (
        id                        TEXT PRIMARY KEY,
        "accountId"               TEXT,
        "providerId"              TEXT,
        "userId"                  TEXT REFERENCES "user"(id),
        password                  TEXT,
        "accessToken"             TEXT,
        "refreshToken"            TEXT,
        "idToken"                 TEXT,
        "accessTokenExpiresAt"    TIMESTAMP,
        "refreshTokenExpiresAt"   TIMESTAMP,
        scope                     TEXT,
        "createdAt"               TIMESTAMP,
        "updatedAt"               TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        id                  TEXT PRIMARY KEY,
        "expiresAt"         TIMESTAMP,
        token               TEXT UNIQUE,
        "createdAt"         TIMESTAMP,
        "updatedAt"         TIMESTAMP,
        "ipAddress"         TEXT,
        "userAgent"         TEXT,
        "userId"            TEXT REFERENCES "user"(id),
        "activeOrganizationId" TEXT
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "verification" (
        id          TEXT PRIMARY KEY,
        identifier  TEXT,
        value       TEXT,
        "expiresAt" TIMESTAMP,
        "createdAt" TIMESTAMP,
        "updatedAt" TIMESTAMP
      )
    `);

    // ---------------------------------------------------------------------------
    // Organization tables
    // ---------------------------------------------------------------------------
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "organization" (
        id          TEXT PRIMARY KEY,
        name        TEXT,
        slug        TEXT UNIQUE,
        logo        TEXT,
        metadata    TEXT,
        "createdAt" TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "member" (
        id               TEXT PRIMARY KEY,
        "userId"         TEXT,
        "organizationId" TEXT,
        role             TEXT,
        "createdAt"      TIMESTAMP,
        UNIQUE ("userId", "organizationId")
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "invitation" (
        id               TEXT PRIMARY KEY,
        "organizationId" TEXT,
        email            TEXT,
        role             TEXT,
        status           TEXT,
        "expiresAt"      TIMESTAMP,
        "inviterId"      TEXT,
        "createdAt"      TIMESTAMP
      )
    `);

    // ---------------------------------------------------------------------------
    // Customer table
    // ---------------------------------------------------------------------------
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "customer" (
        id               TEXT PRIMARY KEY,
        "organizationId" TEXT REFERENCES "organization"(id),
        name             TEXT,
        email            TEXT,
        "createdAt"      TIMESTAMP,
        "updatedAt"      TIMESTAMP
      )
    `);

    console.log("Tables created (or already exist).");

    // ---------------------------------------------------------------------------
    // Hash password once
    // ---------------------------------------------------------------------------
    const hashed = await hashPassword("password123");

    const now = new Date().toISOString();

    // ---------------------------------------------------------------------------
    // Users
    // ---------------------------------------------------------------------------
    const users = [
      {
        id: "00000000-0000-0000-0000-000000000101",
        name: "Alice Admin",
        email: "alice@example.com",
      },
      {
        id: "00000000-0000-0000-0000-000000000102",
        name: "Bob Member",
        email: "bob@example.com",
      },
      {
        id: "00000000-0000-0000-0000-000000000103",
        name: "Charlie Member",
        email: "charlie@example.com",
      },
    ];

    for (const u of users) {
      await pool.query(
        `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, true, $4, $4)
         ON CONFLICT DO NOTHING`,
        [u.id, u.name, u.email, now],
      );
    }

    console.log("Users inserted.");

    // ---------------------------------------------------------------------------
    // Credential accounts
    // ---------------------------------------------------------------------------
    for (const u of users) {
      const accountId = u.id.replace(
        "00000000-0000-0000-0000-000000000",
        "00000000-0000-0000-0001-000000000",
      );
      await pool.query(
        `INSERT INTO "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
         VALUES ($1, $2, 'credential', $3, $4, $5, $5)
         ON CONFLICT DO NOTHING`,
        [accountId, u.email, u.id, hashed, now],
      );
    }

    console.log("Credential accounts inserted.");

    // ---------------------------------------------------------------------------
    // Organizations
    // ---------------------------------------------------------------------------
    const orgs = [
      {
        id: "00000000-0000-0000-0000-000000000001",
        name: "Platform",
        slug: "platform",
      },
      {
        id: "00000000-0000-0000-0000-000000000002",
        name: "Acme Corp",
        slug: "acme-corp",
      },
      {
        id: "00000000-0000-0000-0000-000000000003",
        name: "Globex Inc",
        slug: "globex-inc",
      },
    ];

    for (const o of orgs) {
      await pool.query(
        `INSERT INTO "organization" (id, name, slug, "createdAt")
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [o.id, o.name, o.slug, now],
      );
    }

    console.log("Organizations inserted.");

    // ---------------------------------------------------------------------------
    // Members
    // ---------------------------------------------------------------------------
    const members = [
      // Alice is owner of all 3 orgs
      {
        id: "00000000-0000-0000-0000-000000001001",
        userId: "00000000-0000-0000-0000-000000000101",
        organizationId: "00000000-0000-0000-0000-000000000001",
        role: "owner",
      },
      {
        id: "00000000-0000-0000-0000-000000001002",
        userId: "00000000-0000-0000-0000-000000000101",
        organizationId: "00000000-0000-0000-0000-000000000002",
        role: "owner",
      },
      {
        id: "00000000-0000-0000-0000-000000001003",
        userId: "00000000-0000-0000-0000-000000000101",
        organizationId: "00000000-0000-0000-0000-000000000003",
        role: "owner",
      },
      // Bob is member of Acme Corp
      {
        id: "00000000-0000-0000-0000-000000001004",
        userId: "00000000-0000-0000-0000-000000000102",
        organizationId: "00000000-0000-0000-0000-000000000002",
        role: "member",
      },
      // Charlie is member of Globex Inc
      {
        id: "00000000-0000-0000-0000-000000001005",
        userId: "00000000-0000-0000-0000-000000000103",
        organizationId: "00000000-0000-0000-0000-000000000003",
        role: "member",
      },
    ];

    for (const m of members) {
      await pool.query(
        `INSERT INTO "member" (id, "userId", "organizationId", role, "createdAt")
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [m.id, m.userId, m.organizationId, m.role, now],
      );
    }

    console.log("Members inserted.");

    // ---------------------------------------------------------------------------
    // Customers
    // ---------------------------------------------------------------------------
    const customers = [
      {
        id: "00000000-0000-0000-0000-000000000201",
        organizationId: "00000000-0000-0000-0000-000000000002",
        name: "Acme Customer",
        email: "customer@acme-corp.example.com",
      },
      {
        id: "00000000-0000-0000-0000-000000000202",
        organizationId: "00000000-0000-0000-0000-000000000003",
        name: "Globex Customer",
        email: "customer@globex-inc.example.com",
      },
    ];

    for (const c of customers) {
      await pool.query(
        `INSERT INTO "customer" (id, "organizationId", name, email, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $5)
         ON CONFLICT DO NOTHING`,
        [c.id, c.organizationId, c.name, c.email, now],
      );
    }

    console.log("Customers inserted.");

    console.log("");
    console.log("Seed summary:");
    console.log("  Users:         3 (alice, bob, charlie) — password: password123");
    console.log("  Organizations: 3 (platform, acme-corp, globex-inc)");
    console.log("  Members:       5 (alice owns all 3; bob→acme; charlie→globex)");
    console.log("  Customers:     2");
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
