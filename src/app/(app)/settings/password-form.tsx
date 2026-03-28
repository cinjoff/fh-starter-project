"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/lib/action-utils";
import { changePassword } from "./actions";

const initialState: ActionState = { status: "idle" };

interface PasswordFormProps {
  hasCredentialAccount: boolean;
}

export function PasswordForm({ hasCredentialAccount }: PasswordFormProps) {
  const [state, formAction, isPending] = useActionState(changePassword, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
      formRef.current?.reset();
    }
  }, [state]);

  if (!hasCredentialAccount) {
    return (
      <p className="text-sm text-muted-foreground">
        Password change is not available for social login accounts. Manage your account through your
        identity provider.
      </p>
    );
  }

  const fieldErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="currentPassword">Current Password</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(fieldErrors.currentPassword)}
          aria-describedby={fieldErrors.currentPassword ? "currentPassword-error" : undefined}
          disabled={isPending}
        />
        {fieldErrors.currentPassword && (
          <p id="currentPassword-error" className="text-xs text-destructive">
            {fieldErrors.currentPassword[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="newPassword">New Password</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(fieldErrors.newPassword)}
          aria-describedby={fieldErrors.newPassword ? "newPassword-error" : undefined}
          disabled={isPending}
        />
        {fieldErrors.newPassword && (
          <p id="newPassword-error" className="text-xs text-destructive">
            {fieldErrors.newPassword[0]}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(fieldErrors.confirmPassword)}
          aria-describedby={fieldErrors.confirmPassword ? "confirmPassword-error" : undefined}
          disabled={isPending}
        />
        {fieldErrors.confirmPassword && (
          <p id="confirmPassword-error" className="text-xs text-destructive">
            {fieldErrors.confirmPassword[0]}
          </p>
        )}
      </div>

      {state.status === "error" &&
        !fieldErrors.currentPassword &&
        !fieldErrors.newPassword &&
        !fieldErrors.confirmPassword && <p className="text-sm text-destructive">{state.message}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Updating..." : "Update Password"}
        </Button>
      </div>
    </form>
  );
}
