import { Pool } from "pg";
import { env } from "@/lib/env";

let pool: Pool | null = null;

/**
 * Returns a shared Postgres Pool singleton.
 * Lazily created from env.DATABASE_URL on first call.
 * Throws if DATABASE_URL is not set — callers must check hasDatabaseUrl() first
 * or accept the error (API routes that require DB).
 */
export function getPool(): Pool {
  if (pool) return pool;
  if (!env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Postgres features (organizations, API routes) require a database. " +
        "See README for Supabase setup instructions.",
    );
  }
  pool = new Pool({ connectionString: env.DATABASE_URL });
  return pool;
}

/** Returns true when a Postgres connection string is configured. */
export function hasDatabaseUrl(): boolean {
  return Boolean(env.DATABASE_URL);
}
