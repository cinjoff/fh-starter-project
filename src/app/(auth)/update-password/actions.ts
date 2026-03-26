"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionState } from "@/lib/actions/types";
import { createClient } from "@/lib/supabase/server";

const passwordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function updatePassword(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();

  if (!supabase) {
    return { success: false, message: "Authentication is not configured" };
  }

  const result = passwordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  const { error } = await supabase.auth.updateUser({ password: result.data.password });

  if (error) {
    return { success: false, message: "Failed to update password. Please try again." };
  }

  redirect("/");
}
