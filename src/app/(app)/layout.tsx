import * as Sentry from "@sentry/nextjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { OrgSwitcher } from "@/components/org-switcher";
import { auth } from "@/lib/auth";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login?redirect=/dashboard");
  }

  Sentry.setUser({ id: session.user.id, email: session.user.email });

  if (!session.session.activeOrganizationId) {
    redirect("/create-organization");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b px-4 py-3 flex items-center justify-between">
        <OrgSwitcher activeOrgId={session.session.activeOrganizationId} />
      </header>
      <main>{children}</main>
    </div>
  );
}
