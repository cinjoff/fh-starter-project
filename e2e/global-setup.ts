/**
 * Playwright global setup — verifies local Supabase is running and seed data exists.
 * Runs once before any tests. Fails fast with actionable error messages.
 */

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
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

export default async function globalSetup(): Promise<void> {
  const envVars = loadEnv();
  const connectionString = envVars.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set in .env.local. Run `pnpm setup` to configure your environment.",
    );
  }

  // Verify the connection string targets local Supabase (port 54322).
  // If it doesn't include port 54322 we still attempt the connection — remote
  // databases are technically supported — but we warn the user.
  if (!connectionString.includes("54322")) {
    console.warn(
      "[global-setup] WARNING: DATABASE_URL does not reference port 54322. " +
        "Expected local Supabase. Proceeding anyway.",
    );
  }

  const pool = new Pool({
    connectionString,
    // Fail fast: don't wait 30 s before reporting Supabase is down.
    connectionTimeoutMillis: 5_000,
    // Only acquire a single connection for the health check.
    max: 1,
  });

  try {
    // 1. Verify Postgres is reachable.
    await pool.query("SELECT 1");
  } catch (err) {
    const hint =
      err instanceof Error && err.message.includes("ECONNREFUSED")
        ? `Local Supabase is not running. Run \`pnpm setup\` or \`supabase start\` first.`
        : `Could not connect to Postgres: ${err instanceof Error ? err.message : String(err)}. ` +
          `Run \`pnpm setup\` or \`supabase start\` first.`;
    throw new Error(`[global-setup] ${hint}`);
  }

  // 2. Check that seed data exists (Better Auth creates a "user" table on migration).
  try {
    const result = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM "user"`,
    );
    const userCount = Number(result.rows[0]?.count ?? 0);

    if (userCount === 0) {
      console.log("[global-setup] No seed data found — running seed script...");
      execSync("npx tsx scripts/seed.ts", {
        cwd: path.resolve(__dirname, ".."),
        stdio: "inherit",
      });
      const recheck = await pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM "user"`,
      );
      const recheckCount = Number(recheck.rows[0]?.count ?? 0);
      console.log(`[global-setup] Seed complete — ${recheckCount} user(s) found.`);
    } else {
      console.log(`[global-setup] Database OK — ${userCount} user(s) found.`);
    }
  } catch (err) {
    // The "user" table might not exist yet (migrations haven't run).
    console.log(
      `[global-setup] "user" table not found (${err instanceof Error ? err.message : String(err)}) — running seed script...`,
    );
    execSync("npx tsx scripts/seed.ts", {
      cwd: path.resolve(__dirname, ".."),
      stdio: "inherit",
    });
    const recheck = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM "user"`,
    );
    const recheckCount = Number(recheck.rows[0]?.count ?? 0);
    console.log(`[global-setup] Seed complete — ${recheckCount} user(s) found.`);
  }

  await pool.end();
}
