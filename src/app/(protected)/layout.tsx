import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login?redirect=/dashboard");
  }

  if (
    env.ENABLE_ORGANIZATIONS &&
    !("activeOrganizationId" in session.session && session.session.activeOrganizationId)
  ) {
    redirect("/create-organization");
  }

  return <>{children}</>;
}
