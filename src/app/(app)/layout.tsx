import * as Sentry from "@sentry/nextjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { auth } from "@/lib/auth";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login?redirect=/dashboard");
  }

  Sentry.setUser({ id: session.user.id, email: session.user.email });

  const activeOrgId = (session.session as Record<string, unknown>).activeOrganizationId as
    | string
    | undefined;

  if (!activeOrgId) {
    redirect("/create-organization");
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar
          activeOrgId={activeOrgId}
          user={{
            name: session.user.name,
            email: session.user.email,
          }}
        />
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger aria-label="Toggle navigation" />
          </header>
          <div className="flex-1 p-4">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
