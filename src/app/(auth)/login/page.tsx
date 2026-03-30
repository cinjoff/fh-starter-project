import { Suspense } from "react";
import { env } from "@/lib/env";
import { LoginForm } from "./login-form";

const googleAuthEnabled = Boolean(env.GOOGLE_CLIENT_ID) && Boolean(env.GOOGLE_CLIENT_SECRET);
const isDev = process.env.NODE_ENV === "development";
const emailVerificationRequired = Boolean(env.RESEND_API_KEY);

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm
        googleAuthEnabled={googleAuthEnabled}
        isDev={isDev}
        emailVerificationRequired={emailVerificationRequired}
      />
    </Suspense>
  );
}
