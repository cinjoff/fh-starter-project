import type { PaginationMeta } from "@/lib/api-response";
import { getPool } from "@/lib/db";
import type { Organization } from "@/lib/types";

/**
 * Converts a display name into a URL-safe slug.
 * Lowercases, replaces non-alphanumeric characters with hyphens,
 * collapses consecutive hyphens, and trims leading/trailing hyphens.
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Returns the organization with the given slug, or null if not found.
 */
export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  const pool = getPool();
  const result = await pool.query<{
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    createdAt: Date;
  }>(`SELECT id, name, slug, logo, "createdAt" FROM organization WHERE slug = $1`, [slug]);

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logo: row.logo ?? undefined,
    createdAt: row.createdAt,
  };
}

/**
 * Lists all organizations a user belongs to, with pagination.
 *
 * NOTE: createOrganization is NOT here — POST routes delegate to auth.api.createOrganization().
 */
export async function listUserOrganizations(
  userId: string,
  page: number,
  perPage: number,
): Promise<{ organizations: Organization[]; pagination: PaginationMeta }> {
  const pool = getPool();
  const offset = (page - 1) * perPage;

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) AS count
     FROM organization o
     JOIN member m ON o.id = m."organizationId"
     WHERE m."userId" = $1`,
    [userId],
  );
  const total = Number.parseInt(countResult.rows[0].count, 10);
  const total_pages = total === 0 ? 0 : Math.ceil(total / perPage);

  const rowsResult = await pool.query<{
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    createdAt: Date;
  }>(
    `SELECT o.id, o.name, o.slug, o.logo, o."createdAt"
     FROM organization o
     JOIN member m ON o.id = m."organizationId"
     WHERE m."userId" = $1
     ORDER BY o."createdAt" ASC
     LIMIT $2 OFFSET $3`,
    [userId, perPage, offset],
  );

  const organizations: Organization[] = rowsResult.rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    logo: row.logo ?? undefined,
    createdAt: row.createdAt,
  }));

  return {
    organizations,
    pagination: {
      page,
      per_page: perPage,
      total,
      total_pages,
    },
  };
}
