"use server";

import * as Sentry from "@sentry/nextjs";
import { APIError } from "better-auth";
import { headers } from "next/headers";
import { z } from "zod";
import { type ActionState, actionError, actionSuccess, parseFormData } from "@/lib/action-utils";
import { auth } from "@/lib/auth";

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be 100 characters or fewer"),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function updateProfile(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return Sentry.withServerActionInstrumentation(
    "updateProfile",
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

      const parsed = parseFormData(updateProfileSchema, formData);
      if (!parsed.success) {
        return parsed.state;
      }

      const { name } = parsed.data;

      try {
        await auth.api.updateUser({ body: { name }, headers: reqHeaders });
        return actionSuccess("Profile updated successfully");
      } catch (err) {
        if (err instanceof APIError) {
          return actionError(err.message ?? "Failed to update profile");
        }
        throw err;
      }
    },
  );
}

export async function changePassword(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return Sentry.withServerActionInstrumentation(
    "changePassword",
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

      const parsed = parseFormData(changePasswordSchema, formData);
      if (!parsed.success) {
        return parsed.state;
      }

      const { currentPassword, newPassword } = parsed.data;

      try {
        await auth.api.changePassword({
          body: { currentPassword, newPassword },
          headers: reqHeaders,
        });
        return actionSuccess("Password changed successfully");
      } catch (err) {
        if (err instanceof APIError) {
          const code = err.body?.code;
          if (code === "INVALID_PASSWORD") {
            return actionError("Current password is incorrect");
          }
          if (code === "CREDENTIAL_ACCOUNT_NOT_FOUND") {
            return actionError("Password change not available for social login accounts");
          }
          if (code === "PASSWORD_TOO_SHORT" || code === "PASSWORD_TOO_LONG") {
            return actionError(err.message ?? "Password does not meet requirements");
          }
          return actionError("Failed to change password");
        }
        throw err;
      }
    },
  );
}
