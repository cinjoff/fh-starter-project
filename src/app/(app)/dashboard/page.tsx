import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  const session = auth ? await auth.api.getSession({ headers: await headers() }) : null;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">
          Welcome, {session?.user.email ?? session?.user.name ?? "User"}
        </h1>
        <SignOutButton />
      </div>
    </div>
  );
}
