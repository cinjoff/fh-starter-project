import { Suspense } from "react";
import { env } from "@/lib/env";
import { LoginForm } from "./login-form";

const googleAuthEnabled = Boolean(env.GOOGLE_CLIENT_ID) && Boolean(env.GOOGLE_CLIENT_SECRET);

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm googleAuthEnabled={googleAuthEnabled} />
    </Suspense>
  );
}
