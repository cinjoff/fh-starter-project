import type { Metadata } from "next";
import { OrgTree } from "./org-tree";
import { RecentErrors } from "./recent-errors";
import { AuthModeCard, DatabaseCard, OrgCountCard } from "./status-cards";

export const metadata: Metadata = {
  title: "Dev Dashboard",
};

export default function DevDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Development Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <AuthModeCard />
        <DatabaseCard />
        <OrgCountCard />
      </div>
      <div className="w-full mb-8">
        <RecentErrors />
      </div>
      <div className="w-full">
        <OrgTree />
      </div>
    </div>
  );
}
