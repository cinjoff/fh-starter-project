import { ConflictError } from "@/lib/api-errors";
import type { PaginationMeta } from "@/lib/api-response";
import { getPool } from "@/lib/db";
import type { Member, MemberRole } from "@/lib/types";

export type MemberWithUser = Member & {
  userName: string;
  userEmail: string;
};

/**
 * Lists all members of an organization, with user details and pagination.
 *
 * NOTE: inviteMember, updateMemberRole, removeMember are NOT here — route handlers
 * delegate to auth.api.*.
 */
export async function listOrgMembers(
  orgId: string,
  page: number,
  perPage: number,
): Promise<{ members: MemberWithUser[]; pagination: PaginationMeta }> {
  const pool = getPool();
  const offset = (page - 1) * perPage;

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM member WHERE "organizationId" = $1`,
    [orgId],
  );
  const total = Number.parseInt(countResult.rows[0].count, 10);
  const total_pages = total === 0 ? 0 : Math.ceil(total / perPage);

  const rowsResult = await pool.query<{
    id: string;
    userId: string;
    organizationId: string;
    role: MemberRole;
    createdAt: Date;
    userName: string;
    userEmail: string;
  }>(
    `SELECT m.id, m."userId", m."organizationId", m.role, m."createdAt",
            u.name AS "userName", u.email AS "userEmail"
     FROM member m
     JOIN "user" u ON m."userId" = u.id
     WHERE m."organizationId" = $1
     ORDER BY m."createdAt" ASC
     LIMIT $2 OFFSET $3`,
    [orgId, perPage, offset],
  );

  const members: MemberWithUser[] = rowsResult.rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    organizationId: row.organizationId,
    role: row.role,
    createdAt: row.createdAt,
    userName: row.userName,
    userEmail: row.userEmail,
  }));

  return {
    members,
    pagination: {
      page,
      per_page: perPage,
      total,
      total_pages,
    },
  };
}

/**
 * Returns the count of owner-role members in an organization.
 */
export async function countOwners(orgId: string): Promise<number> {
  const pool = getPool();
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM member WHERE "organizationId" = $1 AND role = 'owner'`,
    [orgId],
  );
  return Number.parseInt(result.rows[0].count, 10);
}

/**
 * Returns a member (with user details) by their member id and org id, or null if not found.
 * Used for pre-mutation checks.
 */
export async function getMemberById(
  memberId: string,
  orgId: string,
): Promise<MemberWithUser | null> {
  const pool = getPool();
  const result = await pool.query<{
    id: string;
    userId: string;
    organizationId: string;
    role: MemberRole;
    createdAt: Date;
    userName: string;
    userEmail: string;
  }>(
    `SELECT m.id, m."userId", m."organizationId", m.role, m."createdAt",
            u.name AS "userName", u.email AS "userEmail"
     FROM member m
     JOIN "user" u ON m."userId" = u.id
     WHERE m.id = $1 AND m."organizationId" = $2`,
    [memberId, orgId],
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.userId,
    organizationId: row.organizationId,
    role: row.role,
    createdAt: row.createdAt,
    userName: row.userName,
    userEmail: row.userEmail,
  };
}

/**
 * Guard: throws ConflictError if the given member is an owner and the only owner in the org.
 * Used before PATCH role and DELETE member operations to protect org integrity.
 */
export async function assertNotLastOwner(memberId: string, orgId: string): Promise<void> {
  const member = await getMemberById(memberId, orgId);
  if (!member || member.role !== "owner") return;

  const ownerCount = await countOwners(orgId);
  if (ownerCount <= 1) {
    throw new ConflictError("Cannot remove or demote the last owner");
  }
}
