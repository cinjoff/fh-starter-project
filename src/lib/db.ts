import { Pool } from "pg";
import { env } from "@/lib/env";

let pool: Pool | null = null;

/**
 * Returns a shared Postgres Pool singleton.
 * Lazily created from env.DATABASE_URL on first call.
 * DATABASE_URL is required — this always returns a Pool.
 */
export function getPool(): Pool {
  if (pool) return pool;
  pool = new Pool({ connectionString: env.DATABASE_URL });
  return pool;
}
