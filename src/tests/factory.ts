/**
 * TestFactory — typed builder for creating real DB records in local Supabase.
 *
 * Usage:
 *   const factory = new TestFactory();
 *   const user = await factory.user().withOrg("acme").asAdmin().create();
 *   await factory.cleanup();
 *
 * Deterministic IDs use a monotonic counter seeded per TestFactory instance so
 * parallel test files don't collide.  Each factory instance tracks its own
 * created records and deletes them in reverse-insert order on cleanup().
 *
 * Password hashing uses scrypt (node:crypto) which is what Better Auth v1 uses
 * by default for email/password accounts.
 */

import * as crypto from "node:crypto";
import { Pool } from "pg";
import { loadEnv } from "./load-env";

const envVars = loadEnv();

// ---------------------------------------------------------------------------
// Shared pg pool (lazy, one per process)
// ---------------------------------------------------------------------------

let _pool: Pool | null = null;

function getPool(): Pool {
  if (_pool) return _pool;
  const url = envVars.DATABASE_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error("TestFactory requires DATABASE_URL — add it to .env.local or set the env var");
  }
  _pool = new Pool({ connectionString: url });
  return _pool;
}

/** Call once at the end of your test suite / global teardown. */
export async function closePool(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
  }
}

// ---------------------------------------------------------------------------
// Password hashing (scrypt — Better Auth default)
// ---------------------------------------------------------------------------

async function hashPassword(password: string): Promise<string> {
  // Better Auth scrypt format: "scrypt:<N>:<r>:<p>:<salt_hex>:<hash_hex>"
  // Note: r=8 (not 16) keeps N*r*p*128 within Node's default 32 MB scrypt maxmem.
  // Better Auth uses N=16384, r=8, p=1 as its default scrypt parameters.
  const N = 16384;
  const r = 8;
  const p = 1;
  const salt = crypto.randomBytes(16);
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, { N, r, p }, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
  return `scrypt:${N}:${r}:${p}:${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

let _instanceCounter = 0;

function makeId(prefix: string, counter: number): string {
  const instance = ++_instanceCounter;
  return `${prefix}-${String(instance).padStart(3, "0")}-${String(counter).padStart(3, "0")}`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UserRole = "admin" | "member" | "owner";

export interface CreatedUser {
  id: string;
  email: string;
  name: string;
  password: string;
}

export interface CreatedOrg {
  id: string;
  name: string;
  slug: string;
}

export interface CreatedMember {
  id: string;
  userId: string;
  organizationId: string;
  role: UserRole;
}

type CleanupRecord =
  | { type: "member"; id: string }
  | { type: "account"; id: string }
  | { type: "session"; userId: string }
  | { type: "user"; id: string }
  | { type: "organization"; id: string };

// ---------------------------------------------------------------------------
// UserBuilder
// ---------------------------------------------------------------------------

export class UserBuilder {
  private _email: string | null = null;
  private _name: string | null = null;
  private _password = "Password1!";
  private _orgSlug: string | null = null;
  private _role: UserRole = "member";
  private readonly _factory: TestFactory;
  private readonly _seq: number;

  constructor(factory: TestFactory, seq: number) {
    this._factory = factory;
    this._seq = seq;
  }

  withEmail(email: string): this {
    this._email = email;
    return this;
  }

  withName(name: string): this {
    this._name = name;
    return this;
  }

  withPassword(password: string): this {
    this._password = password;
    return this;
  }

  withOrg(slug: string): this {
    this._orgSlug = slug;
    return this;
  }

  asAdmin(): this {
    this._role = "admin";
    return this;
  }

  asMember(): this {
    this._role = "member";
    return this;
  }

  asOwner(): this {
    this._role = "owner";
    return this;
  }

  async create(): Promise<CreatedUser> {
    const id = makeId("test-user", this._seq);
    const email = this._email ?? `test-user-${this._seq}@factory.test`;
    const name = this._name ?? `Test User ${this._seq}`;
    const now = new Date();

    const pool = getPool();
    const passwordHash = await hashPassword(this._password);

    // Insert user
    await pool.query(
      `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO NOTHING`,
      [id, name, email, true, now, now],
    );
    this._factory._track({ type: "user", id });

    // Insert account (email/password provider)
    const accountId = `${id}-account`;
    await pool.query(
      `INSERT INTO account (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [accountId, id, email, "credential", passwordHash, now, now],
    );
    this._factory._track({ type: "account", id: accountId });

    // If an org slug is provided, ensure the org exists and create membership
    if (this._orgSlug) {
      const org = await this._factory
        .org()
        .withSlug(this._orgSlug)
        .withName(this._orgSlug)
        ._ensureExists();

      const memberId = `${id}-member-${org.id}`;
      await pool.query(
        `INSERT INTO member (id, "organizationId", "userId", role, "createdAt")
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [memberId, org.id, id, this._role, now],
      );
      this._factory._track({ type: "member", id: memberId });
    }

    return { id, email, name, password: this._password };
  }
}

// ---------------------------------------------------------------------------
// OrgBuilder
// ---------------------------------------------------------------------------

export class OrgBuilder {
  private _name: string | null = null;
  private _slug: string | null = null;
  private readonly _factory: TestFactory;
  private readonly _seq: number;

  constructor(factory: TestFactory, seq: number) {
    this._factory = factory;
    this._seq = seq;
  }

  withName(name: string): this {
    this._name = name;
    return this;
  }

  withSlug(slug: string): this {
    this._slug = slug;
    return this;
  }

  async create(): Promise<CreatedOrg> {
    return this._ensureExists();
  }

  /** Internal: idempotently create the org and return it. */
  async _ensureExists(): Promise<CreatedOrg> {
    const slug = this._slug ?? `test-org-${this._seq}`;
    const name = this._name ?? `Test Org ${this._seq}`;

    const pool = getPool();

    // Check if an org with this slug already exists (created by the same factory run)
    const existing = await pool.query<{ id: string }>(
      `SELECT id FROM organization WHERE slug = $1`,
      [slug],
    );
    if (existing.rows.length > 0) {
      return { id: existing.rows[0].id, name, slug };
    }

    const id = makeId("test-org", this._seq);
    const now = new Date();
    await pool.query(
      `INSERT INTO organization (id, name, slug, "createdAt")
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [id, name, slug, now],
    );
    this._factory._track({ type: "organization", id });

    return { id, name, slug };
  }
}

// ---------------------------------------------------------------------------
// TestFactory
// ---------------------------------------------------------------------------

/**
 * Main entry point.  Create one instance per test file (or per test if you
 * want fully isolated cleanup granularity).
 *
 * ```ts
 * const factory = new TestFactory();
 * afterEach(() => factory.cleanup());
 *
 * it("does something", async () => {
 *   const user = await factory.user().withOrg("acme").asAdmin().create();
 * });
 * ```
 */
export class TestFactory {
  private _cleanup: CleanupRecord[] = [];
  private _seq = 0;

  /** @internal used by builders to register created records */
  _track(record: CleanupRecord): void {
    this._cleanup.push(record);
  }

  /** Returns a new UserBuilder scoped to this factory. */
  user(): UserBuilder {
    return new UserBuilder(this, ++this._seq);
  }

  /** Returns a new OrgBuilder scoped to this factory. */
  org(): OrgBuilder {
    return new OrgBuilder(this, ++this._seq);
  }

  /**
   * Delete all records created through this factory instance in reverse order
   * (respects FK constraints: members before users/orgs, accounts before users).
   */
  async cleanup(): Promise<void> {
    const pool = getPool();
    const records = [...this._cleanup].reverse();
    this._cleanup = [];

    for (const record of records) {
      try {
        switch (record.type) {
          case "member":
            await pool.query(`DELETE FROM member WHERE id = $1`, [record.id]);
            break;
          case "account":
            await pool.query(`DELETE FROM account WHERE id = $1`, [record.id]);
            break;
          case "session":
            await pool.query(`DELETE FROM session WHERE "userId" = $1`, [record.userId]);
            break;
          case "user":
            await pool.query(`DELETE FROM "user" WHERE id = $1`, [record.id]);
            break;
          case "organization":
            await pool.query(`DELETE FROM organization WHERE id = $1`, [record.id]);
            break;
        }
      } catch (err) {
        console.warn(`[TestFactory] cleanup failed for ${record.type}`, err);
      }
    }
  }

  /**
   * Static convenience: create a one-shot factory, run the callback, then
   * clean up automatically.
   *
   * ```ts
   * await TestFactory.run(async (f) => {
   *   const user = await f.user().create();
   *   // ...
   * });
   * ```
   */
  static async run(fn: (factory: TestFactory) => Promise<void>): Promise<void> {
    const factory = new TestFactory();
    try {
      await fn(factory);
    } finally {
      await factory.cleanup();
    }
  }
}
