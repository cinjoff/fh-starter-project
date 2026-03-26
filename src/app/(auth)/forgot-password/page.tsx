"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/lib/actions/types";
import { resetPassword } from "./actions";

const initialState: ActionState = { success: false };

export default function ForgotPasswordPage() {
  const [state, formAction] = useActionState(resetPassword, initialState);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message);
      } else {
        toast.error(state.message);
      }
    }
  }, [state]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
          <p className="text-muted-foreground text-sm">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              aria-label="Email address"
            />
          </div>

          {state.message && !state.success && (
            <p className="text-destructive text-sm" role="alert">
              {state.message}
            </p>
          )}

          <SubmitButton formAction={formAction} className="w-full" pendingText="Sending...">
            Send reset link
          </SubmitButton>
        </form>

        <p className="text-muted-foreground text-center text-sm">
          <Link href="/login" className="text-foreground underline underline-offset-4">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
