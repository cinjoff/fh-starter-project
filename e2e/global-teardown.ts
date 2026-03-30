import { Client } from "pg";
import { SUPERUSER_URL, TEST_DB_NAME } from "./db-config";

/**
 * Playwright global teardown — drops the test database.
 * The dev Supabase containers stay running (managed by conductor).
 */
export default async function globalTeardown() {
  if (process.env.KEEP_TEST_DB) {
    console.log("[e2e] KEEP_TEST_DB set, leaving test database.");
    return;
  }

  const client = new Client({ connectionString: SUPERUSER_URL });
  await client.connect();

  await client.query(
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()",
    [TEST_DB_NAME],
  );
  await client.query(`DROP DATABASE IF EXISTS ${TEST_DB_NAME}`);
  await client.end();

  console.log("[e2e] Test database dropped.");
}
