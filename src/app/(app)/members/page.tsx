import { headers } from "next/headers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import type { MemberRole } from "@/lib/types";
import { InviteForm } from "./invite-form";
import { MembersList } from "./members-list";

export default async function MembersPage() {
  const reqHeaders = await headers();

  const session = auth ? await auth.api.getSession({ headers: reqHeaders }) : null;
  const activeOrgId = session
    ? ((session.session as Record<string, unknown>).activeOrganizationId as string | undefined)
    : undefined;

  if (!auth || !session || !activeOrgId) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8" data-testid="members-page">
        <p className="text-sm text-muted-foreground">Unable to load members.</p>
      </div>
    );
  }

  const [activeMember, fullOrg] = await Promise.all([
    auth.api.getActiveMember({ headers: reqHeaders }).catch(() => null),
    auth.api.getFullOrganization({ headers: reqHeaders }).catch(() => null),
  ]);

  const currentUserRole = (activeMember?.role ?? "member") as MemberRole;
  const isPrivileged = currentUserRole === "owner" || currentUserRole === "admin";

  const members = fullOrg?.members ?? [];
  const invitations = (fullOrg?.invitations ?? []).filter((inv) => inv.status === "pending");

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8" data-testid="members-page">
      <div>
        <h1 className="text-2xl font-bold">Members</h1>
        <p className="text-sm text-muted-foreground">Manage who has access to your organization.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>People who have access to this organization.</CardDescription>
        </CardHeader>
        <CardContent>
          <MembersList
            members={members}
            invitations={invitations}
            currentUserRole={currentUserRole}
          />
        </CardContent>
      </Card>

      {isPrivileged && (
        <Card>
          <CardHeader>
            <CardTitle>Invite Member</CardTitle>
            <CardDescription>
              Send an invitation to add someone to your organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InviteForm />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
