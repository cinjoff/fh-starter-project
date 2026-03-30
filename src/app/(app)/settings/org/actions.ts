"use server";

import * as Sentry from "@sentry/nextjs";
import { APIError } from "better-auth";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { type ActionState, actionError, actionSuccess, parseFormData } from "@/lib/action-utils";
import { auth } from "@/lib/auth";

const updateOrgNameSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(50, "Organization name must be 50 characters or fewer"),
});

export async function updateOrgName(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return Sentry.withServerActionInstrumentation(
    "updateOrgName",
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

      const activeMember = await auth.api
        .getActiveMember({ headers: reqHeaders })
        .catch(() => null);
      if (!activeMember || (activeMember.role !== "owner" && activeMember.role !== "admin")) {
        return actionError("Insufficient permissions");
      }

      const parsed = parseFormData(updateOrgNameSchema, formData);
      if (!parsed.success) {
        return parsed.state;
      }

      const { name } = parsed.data;

      try {
        await auth.api.updateOrganization({
          body: { organizationId: activeOrgId, data: { name } },
          headers: reqHeaders,
        });
        revalidatePath("/");
        return actionSuccess("Organization name updated successfully");
      } catch (err) {
        if (err instanceof APIError) {
          return actionError(err.message ?? "Failed to update organization name");
        }
        throw err;
      }
    },
  );
}

export async function leaveOrg(_prevState: ActionState, _formData: FormData): Promise<ActionState> {
  return Sentry.withServerActionInstrumentation("leaveOrg", { recordResponse: true }, async () => {
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

    try {
      await auth.api.removeMember({
        body: { organizationId: activeOrgId, memberIdOrEmail: session.user.id },
        headers: reqHeaders,
      });
      revalidatePath("/");
      return actionSuccess("Left organization");
    } catch (err) {
      if (err instanceof APIError) {
        const code = (err.body as Record<string, unknown> | undefined)?.code;
        if (
          code === "LAST_OWNER" ||
          code === "YOU_ARE_THE_LAST_OWNER" ||
          code === "CANNOT_LEAVE_LAST_OWNER"
        ) {
          return actionError("Cannot leave as the last owner. Transfer ownership first.");
        }
        return actionError(err.message ?? "Failed to leave organization");
      }
      throw err;
    }
  });
}
