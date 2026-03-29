import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { OrgSettingsForm } from "./org-settings-form";

export default async function OrgSettingsPage() {
  const reqHeaders = await headers();
  const session = auth ? await auth.api.getSession({ headers: reqHeaders }) : null;

  if (!session) {
    redirect("/login");
  }

  const activeOrgId = (session.session as Record<string, unknown>).activeOrganizationId as
    | string
    | undefined;

  if (!activeOrgId) {
    redirect("/create-organization");
  }

  let orgName = "";
  let orgSlug = "";

  if (auth) {
    try {
      const org = await auth.api.getFullOrganization({ headers: reqHeaders });
      orgName = org?.name ?? "";
      orgSlug = org?.slug ?? "";
    } catch {
      // Fallback to empty strings if org fetch fails
    }
  }

  return (
    <div className="space-y-6" data-testid="org-settings-page">
      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>Manage your organization settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <OrgSettingsForm orgName={orgName} orgSlug={orgSlug} />
        </CardContent>
      </Card>
    </div>
  );
}
