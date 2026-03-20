"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/actions/types";
import { createClient } from "@/lib/supabase/server";

export async function login(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();

  if (!supabase) {
    return { success: false, message: "Authentication is not configured" };
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient();

  if (!supabase) {
    return { success: false, message: "Authentication is not configured" };
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
