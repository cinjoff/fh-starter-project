import { Suspense } from "react";
import { localAuthMode } from "@/lib/auth";
import { env } from "@/lib/env";
import { LoginForm } from "./login-form";

const googleAuthEnabled = Boolean(env.GOOGLE_CLIENT_ID) && Boolean(env.GOOGLE_CLIENT_SECRET);

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm localAuthMode={localAuthMode} googleAuthEnabled={googleAuthEnabled} />
    </Suspense>
  );
}
