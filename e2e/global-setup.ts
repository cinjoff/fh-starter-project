/**
 * Playwright global setup — creates an isolated test database inside the
 * already-running dev Supabase postgres. Workers and webServer read
 * DATABASE_URL from the committed .env.test file.
 */

import { execSync } from "node:child_process";
import * as path from "node:path";
import { Client, Pool } from "pg";
import { SUPERUSER_URL, TEST_DB_NAME, TEST_DB_URL } from "./db-config";

export default async function globalSetup(): Promise<void> {
  // 1. Ensure Docker and Supabase are running
  try {
    execSync("docker info", { stdio: "pipe" });
  } catch {
    throw new Error("Docker is not running. Start OrbStack or Docker Desktop and try again.");
  }

  try {
    execSync("supabase status", { stdio: "pipe" });
  } catch {
    console.log("[e2e] Dev Supabase not running — starting it...");
    execSync("supabase start", { stdio: "inherit", timeout: 120_000 });
  }

  // 2. Create the test database (drop + recreate for clean state)
  const client = new Client({ connectionString: SUPERUSER_URL });
  await client.connect();

  await client.query(
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()",
    [TEST_DB_NAME],
  );
  await client.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME}`);
  await client.query(`CREATE DATABASE ${TEST_DB_NAME}`);
  await client.end();

  // 3. Run migrations against the test DB
  execSync(`supabase db push --db-url "${TEST_DB_URL}" --include-all`, {
    stdio: "inherit",
    timeout: 60_000,
  });

  // 4. Seed with test data
  execSync("npx tsx scripts/seed.ts", {
    cwd: path.resolve(__dirname, ".."),
    stdio: "inherit",
    timeout: 30_000,
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
  });

  // 5. Verify seed data
  const pool = new Pool({ connectionString: TEST_DB_URL, max: 1 });
  try {
    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM "user"`,
    );
    console.log(`[e2e] Test database ready — ${result.rows[0]?.count} user(s) seeded.`);
  } finally {
    await pool.end();
  }

  process.env.DATABASE_URL = TEST_DB_URL;
}
