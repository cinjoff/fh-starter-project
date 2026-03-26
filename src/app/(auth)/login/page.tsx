import { Suspense } from "react";
import { localAuthMode } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm localAuthMode={localAuthMode} />
    </Suspense>
  );
}
