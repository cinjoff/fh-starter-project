"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/lib/action-utils";
import { leaveOrg, updateOrgName } from "./actions";

const initialState: ActionState = { status: "idle" };

interface OrgSettingsFormProps {
  orgName: string;
  orgSlug: string;
}

export function OrgSettingsForm({ orgName, orgSlug }: OrgSettingsFormProps) {
  const [updateState, updateFormAction, isUpdatePending] = useActionState(
    updateOrgName,
    initialState,
  );
  const [leaveState, leaveFormAction, isLeavePending] = useActionState(leaveOrg, initialState);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (updateState.status === "success") {
      toast.success(updateState.message);
    }
  }, [updateState]);

  useEffect(() => {
    if (leaveState.status === "success") {
      toast.success(leaveState.message);
      setConfirmOpen(false);
    } else if (leaveState.status === "error") {
      toast.error(leaveState.message);
      setConfirmOpen(false);
    }
  }, [leaveState]);

  const updateFieldErrors = updateState.status === "error" ? (updateState.fieldErrors ?? {}) : {};

  return (
    <>
      <form action={updateFormAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Organization Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            defaultValue={orgName}
            aria-invalid={Boolean(updateFieldErrors.name)}
            aria-describedby={updateFieldErrors.name ? "name-error" : undefined}
            disabled={isUpdatePending}
          />
          {updateFieldErrors.name && (
            <p id="name-error" className="text-xs text-destructive">
              {updateFieldErrors.name[0]}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="slug">Slug</Label>
          <p id="slug" className="text-sm text-muted-foreground">
            {orgSlug}
          </p>
        </div>

        {updateState.status === "error" && !updateFieldErrors.name && (
          <p className="text-sm text-destructive">{updateState.message}</p>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isUpdatePending}>
            {isUpdatePending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>

      <div className="mt-8 rounded-lg border border-destructive/50 p-4">
        <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Leaving this organization will remove your access to all its resources.
        </p>
        <div className="mt-4">
          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogTrigger render={<Button variant="destructive" size="sm" />}>
              Leave Organization
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Leave Organization</DialogTitle>
                <DialogDescription>
                  Are you sure you want to leave <strong>{orgName}</strong>? You will lose access to
                  all its resources. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setConfirmOpen(false)}
                  disabled={isLeavePending}
                >
                  Cancel
                </Button>
                <form action={leaveFormAction}>
                  <Button type="submit" variant="destructive" disabled={isLeavePending}>
                    {isLeavePending ? "Leaving..." : "Leave Organization"}
                  </Button>
                </form>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </>
  );
}
