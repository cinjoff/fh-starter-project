"use server";

import { z } from "zod";
import type { ActionState } from "@/lib/actions/types";
import { createClient } from "@/lib/supabase/server";

const emailSchema = z.object({
  email: z.email("Invalid email address"),
});

export async function resetPassword(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();

  if (!supabase) {
    return { success: false, message: "Authentication is not configured" };
  }

  const result = emailSchema.safeParse({
    email: formData.get("email"),
  });

  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(result.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback?next=/update-password`,
  });

  if (error) {
    return { success: false, message: "Failed to send reset email. Please try again." };
  }

  return { success: true, message: "Check your email for a password reset link." };
}
