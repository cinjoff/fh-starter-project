"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/lib/action-utils";
import { updateProfile } from "./actions";

const initialState: ActionState = { status: "idle" };

interface ProfileFormProps {
  userName: string;
}

export function ProfileForm({ userName }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfile, initialState);

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message);
    }
  }, [state]);

  const fieldErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          defaultValue={userName}
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "name-error" : undefined}
          disabled={isPending}
        />
        {fieldErrors.name && (
          <p id="name-error" className="text-xs text-destructive">
            {fieldErrors.name[0]}
          </p>
        )}
      </div>

      {state.status === "error" && !fieldErrors.name && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
