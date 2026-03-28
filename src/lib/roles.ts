import { ForbiddenError } from "@/lib/api-errors";
import type { MemberRole } from "@/lib/types";

const ROLE_HIERARCHY: Record<MemberRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

const VALID_ROLES = new Set<string>(["owner", "admin", "member"]);

export type MemberContext = {
  role: MemberRole;
  userId: string;
  organizationId: string;
  isOwner: boolean;
  isAdmin: boolean;
  isMember: boolean;
};

export function buildMemberContext(member: {
  role: string;
  userId: string;
  organizationId: string;
}): MemberContext {
  if (!VALID_ROLES.has(member.role)) {
    throw new ForbiddenError(`Invalid role: ${member.role}`);
  }

  const role = member.role as MemberRole;

  return {
    role,
    userId: member.userId,
    organizationId: member.organizationId,
    isOwner: role === "owner",
    isAdmin: role === "owner" || role === "admin",
    isMember: true,
  };
}

export function requireRole(ctx: MemberContext, minRole: MemberRole): void {
  if (ROLE_HIERARCHY[ctx.role] < ROLE_HIERARCHY[minRole]) {
    throw new ForbiddenError(`Requires role '${minRole}', but current role is '${ctx.role}'`);
  }
}

export function hasRole(ctx: MemberContext, minRole: MemberRole): boolean {
  return ROLE_HIERARCHY[ctx.role] >= ROLE_HIERARCHY[minRole];
}
