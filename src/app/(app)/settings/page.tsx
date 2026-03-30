import { headers } from "next/headers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { PasswordForm } from "./password-form";
import { ProfileForm } from "./profile-form";

export default async function SettingsPage() {
  const reqHeaders = await headers();
  const session = auth ? await auth.api.getSession({ headers: reqHeaders }) : null;

  let hasCredentialAccount = false;
  if (auth && session) {
    try {
      const accounts = await auth.api.listUserAccounts({
        headers: reqHeaders,
      });
      hasCredentialAccount = accounts.some((account) => account.providerId === "credential");
    } catch {
      // If listing accounts fails, fall back to false
    }
  }

  const userName = session?.user.name ?? "";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your display name.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm userName={userName} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Change your account password.</CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm hasCredentialAccount={hasCredentialAccount} />
        </CardContent>
      </Card>
    </div>
  );
}
