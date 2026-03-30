"use client";

import { useState, useTransition } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MemberRole } from "@/lib/types";
import { removeMember } from "./actions";

interface MemberUser {
  id: string;
  email: string;
  name: string;
  image?: string;
}

interface MemberItem {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  createdAt: Date;
  user: MemberUser;
}

interface InvitationItem {
  id: string;
  organizationId: string;
  email: string;
  role: string;
  status: string;
  inviterId: string;
  expiresAt: Date;
  createdAt: Date;
}

interface MembersListProps {
  members: MemberItem[];
  invitations: InvitationItem[];
  currentUserRole: MemberRole;
}

function RoleBadge({ role }: { role: string }) {
  return <span className="rounded-none border px-1.5 py-0.5 text-xs capitalize">{role}</span>;
}

function StatusBadge({ status }: { status: string }) {
  return <span className="rounded-none border px-1.5 py-0.5 text-xs capitalize">{status}</span>;
}

function RemoveMemberButton({ member }: { member: MemberItem }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRemove() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("memberId", member.id);

      const result = await removeMember({ status: "idle" }, formData);

      if (result.status === "success") {
        toast.success(result.message);
        setOpen(false);
      } else if (result.status === "error") {
        toast.error(result.message);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>Remove</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove member</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove <strong>{member.user.name || member.user.email}</strong>{" "}
            from the organization? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleRemove} disabled={isPending}>
            {isPending ? "Removing..." : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MembersList({ members, invitations, currentUserRole }: MembersListProps) {
  const isPrivileged = currentUserRole === "owner" || currentUserRole === "admin";

  return (
    <div className="flex flex-col gap-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            {isPrivileged && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={isPrivileged ? 5 : 4}
                className="text-center text-muted-foreground"
              >
                No members found.
              </TableCell>
            </TableRow>
          )}
          {members.map((member) => (
            <TableRow key={member.id} data-testid={`member-row-${member.id}`}>
              <TableCell>{member.user.name}</TableCell>
              <TableCell>{member.user.email}</TableCell>
              <TableCell>
                <RoleBadge role={member.role} />
              </TableCell>
              <TableCell>{new Date(member.createdAt).toLocaleDateString()}</TableCell>
              {isPrivileged && (
                <TableCell className="text-right">
                  {member.role !== "owner" && <RemoveMemberButton member={member} />}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {invitations.length > 0 && (
        <div data-testid="pending-invitations">
          <h2 className="mb-2 text-sm font-semibold">Pending Invitations</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell>{invitation.email}</TableCell>
                  <TableCell>
                    <RoleBadge role={invitation.role} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={invitation.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
