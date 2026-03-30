import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const roleBadgeClass: Record<string, string> = {
  owner: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  admin: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  member: "bg-muted text-muted-foreground",
};

export default async function DashboardPage() {
  const hdrs = await headers();
  const session = auth ? await auth.api.getSession({ headers: hdrs }) : null;

  const org = auth ? await auth.api.getFullOrganization({ headers: hdrs }).catch(() => null) : null;

  const activeMember = auth
    ? await auth.api.getActiveMember({ headers: hdrs }).catch(() => null)
    : null;

  const userName = session?.user.name ?? session?.user.email ?? "User";
  const orgName = org?.name ?? "—";
  const memberCount = org?.members?.length ?? 0;
  const role = activeMember?.role ?? "member";

  return (
    <div className="p-6 space-y-6 max-w-4xl" data-testid="dashboard-page">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Welcome back, {userName}</h1>
        <span
          className={cn(
            "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium capitalize",
            roleBadgeClass[role] ?? roleBadgeClass.member,
          )}
        >
          {role}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Organization</CardDescription>
            <CardTitle className="text-lg">{orgName}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Members</CardDescription>
            <CardTitle className="text-lg">{memberCount}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Your Role</CardDescription>
            <CardTitle className="text-lg capitalize">{role}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Getting Started — dev only */}
      {process.env.NODE_ENV === "development" && (
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              This is a starter template. Here&apos;s how to make it yours:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="shrink-0 font-medium text-foreground">1.</span>
                <span>
                  Run{" "}
                  <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
                    /fh:ui-branding
                  </code>{" "}
                  to customize your colors, typography, and design language.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 font-medium text-foreground">2.</span>
                <span>
                  Run{" "}
                  <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
                    /fh:plan-work
                  </code>{" "}
                  to plan your first feature — describe what you want and get a step-by-step plan.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 font-medium text-foreground">3.</span>
                <span>
                  Run{" "}
                  <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">/fh:build</code>{" "}
                  to turn your plan into working code with tests and quality checks.
                </span>
              </li>
            </ul>
            <p className="text-xs text-muted-foreground">
              See{" "}
              <a
                href="https://firehorse.network"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-4 hover:text-foreground/80"
              >
                firehorse.network
              </a>{" "}
              for more guides and workflow documentation.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick actions */}
      <div className="flex gap-3">
        <Button variant="default" nativeButton={false} render={<Link href="/members" />}>
          Manage Members
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/settings" />}>
          Settings
        </Button>
      </div>
    </div>
  );
}
