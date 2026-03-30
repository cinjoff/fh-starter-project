import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { SettingsNav } from "./settings-nav";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default async function SettingsLayout({ children }: SettingsLayoutProps) {
  const reqHeaders = await headers();
  const session = auth ? await auth.api.getSession({ headers: reqHeaders }) : null;

  const activeOrgId = session
    ? ((session.session as Record<string, unknown>).activeOrganizationId as string | undefined)
    : undefined;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <SettingsNav showOrgTab={Boolean(activeOrgId)} />

      {children}
    </div>
  );
}
