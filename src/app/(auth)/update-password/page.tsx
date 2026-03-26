"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/lib/actions/types";
import { updatePassword } from "./actions";

const initialState: ActionState = { success: false };

export default function UpdatePasswordPage() {
  const [state, formAction] = useActionState(updatePassword, initialState);

  useEffect(() => {
    if (state.message && !state.success) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Update password</h1>
          <p className="text-muted-foreground text-sm">Enter your new password below</p>
        </div>

        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
              aria-label="New password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
              aria-label="Confirm password"
            />
          </div>

          {state.message && !state.success && (
            <p className="text-destructive text-sm" role="alert">
              {state.message}
            </p>
          )}

          <SubmitButton formAction={formAction} className="w-full" pendingText="Updating...">
            Update password
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
