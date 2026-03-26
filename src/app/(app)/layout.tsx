import * as Sentry from "@sentry/nextjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, authEnabled } from "@/lib/auth";
import { env } from "@/lib/env";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  if (!authEnabled || !auth) {
    redirect("/");
  }

  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login?redirect=/dashboard");
  }

  Sentry.setUser({ id: session.user.id, email: session.user.email });

  if (
    env.ENABLE_ORGANIZATIONS &&
    !("activeOrganizationId" in session.session && session.session.activeOrganizationId)
  ) {
    redirect("/create-organization");
  }

  return <>{children}</>;
}
