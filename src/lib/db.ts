import { Pool } from "pg";
import { env } from "@/lib/env";

let pool: Pool | null = null;

/**
 * Returns a shared Postgres Pool singleton.
 * Lazily created from env.DATABASE_URL on first call.
 * Returns null if DATABASE_URL is not configured.
 */
export function getPool(): Pool | null {
  if (pool) return pool;
  if (!env.DATABASE_URL) return null;
  pool = new Pool({ connectionString: env.DATABASE_URL });
  return pool;
}
