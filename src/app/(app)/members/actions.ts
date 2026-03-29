"use server";

import * as Sentry from "@sentry/nextjs";
import { APIError } from "better-auth";
import { headers } from "next/headers";
import { z } from "zod";
import { type ActionState, actionError, actionSuccess, parseFormData } from "@/lib/action-utils";
import { auth } from "@/lib/auth";

const inviteMemberSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["member", "admin"]),
});

const removeMemberSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
});

export async function inviteMember(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return Sentry.withServerActionInstrumentation(
    "inviteMember",
    { recordResponse: true },
    async () => {
      if (!auth) {
        return actionError("Authentication is not configured");
      }

      const reqHeaders = await headers();
      const session = await auth.api.getSession({ headers: reqHeaders });
      if (!session) {
        return actionError("Not authenticated");
      }

      const activeOrgId = (session.session as Record<string, unknown>).activeOrganizationId as
        | string
        | undefined;
      if (!activeOrgId) {
        return actionError("No active organization");
      }

      const parsed = parseFormData(inviteMemberSchema, formData);
      if (!parsed.success) {
        return parsed.state;
      }

      const { email, role } = parsed.data;

      try {
        await auth.api.createInvitation({
          body: { organizationId: activeOrgId, email, role },
          headers: reqHeaders,
        });
        return actionSuccess("Invitation sent");
      } catch (err) {
        if (err instanceof APIError) {
          const code = err.body?.code;
          if (
            code === "MEMBER_ALREADY_EXISTS" ||
            code === "INVITATION_ALREADY_EXISTS" ||
            code === "PENDING_INVITATION_ALREADY_EXISTS"
          ) {
            return actionError("This user is already a member or has a pending invitation");
          }
          if (code === "MEMBER_LIMIT_EXCEEDED") {
            return actionError("Organization member limit has been reached");
          }
          return actionError(err.message ?? "Failed to send invitation");
        }
        throw err;
      }
    },
  );
}

export async function removeMember(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return Sentry.withServerActionInstrumentation(
    "removeMember",
    { recordResponse: true },
    async () => {
      if (!auth) {
        return actionError("Authentication is not configured");
      }

      const reqHeaders = await headers();
      const session = await auth.api.getSession({ headers: reqHeaders });
      if (!session) {
        return actionError("Not authenticated");
      }

      const activeOrgId = (session.session as Record<string, unknown>).activeOrganizationId as
        | string
        | undefined;
      if (!activeOrgId) {
        return actionError("No active organization");
      }

      const parsed = parseFormData(removeMemberSchema, formData);
      if (!parsed.success) {
        return parsed.state;
      }

      const { memberId } = parsed.data;

      try {
        await auth.api.removeMember({
          body: { organizationId: activeOrgId, memberIdOrEmail: memberId },
          headers: reqHeaders,
        });
        return actionSuccess("Member removed");
      } catch (err) {
        if (err instanceof APIError) {
          const code = err.body?.code;
          if (code === "LAST_OWNER" || code === "CANNOT_LEAVE_ORGANIZATION") {
            return actionError("Cannot remove the last owner of the organization");
          }
          if (code === "MEMBER_NOT_FOUND") {
            return actionError("Member not found");
          }
          return actionError(err.message ?? "Failed to remove member");
        }
        throw err;
      }
    },
  );
}
