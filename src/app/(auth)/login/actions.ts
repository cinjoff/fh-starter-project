"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionState } from "@/lib/actions/types";
import { createClient } from "@/lib/supabase/server";

const authSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function login(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();

  if (!supabase) {
    return { success: false, message: "Authentication is not configured" };
  }

  const result = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  const { error } = await supabase.auth.signInWithPassword(result.data);

  if (error) {
    return { success: false, message: "Invalid email or password" };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();

  if (!supabase) {
    return { success: false, message: "Authentication is not configured" };
  }

  const result = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return { success: false, message: result.error.issues[0].message };
  }

  const { error } = await supabase.auth.signUp(result.data);

  if (error) {
    return { success: false, message: "Sign up failed. Please try again." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
