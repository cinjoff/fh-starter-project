"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/lib/actions/types";
import { login, signup } from "./actions";

const initialState: ActionState = { success: false };

export default function LoginPage() {
  const [loginState, loginAction] = useActionState(login, initialState);
  const [signupState, signupAction] = useActionState(signup, initialState);
  useEffect(() => {
    if (loginState.message && !loginState.success) {
      toast.error(loginState.message);
    }
  }, [loginState]);

  useEffect(() => {
    if (signupState.message && !signupState.success) {
      toast.error(signupState.message);
    }
  }, [signupState]);

  const errorMessage =
    (loginState.message && !loginState.success ? loginState.message : null) ??
    (signupState.message && !signupState.success ? signupState.message : null);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
          <p className="text-muted-foreground text-sm">Enter your credentials to continue</p>
        </div>

        <form data-testid="login-form" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              data-testid="email-input"
              aria-label="Email address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
              data-testid="password-input"
              aria-label="Password"
            />
          </div>

          {errorMessage && (
            <p className="text-destructive text-sm" data-testid="auth-error" role="alert">
              {errorMessage}
            </p>
          )}

          <div className="flex gap-2">
            <SubmitButton formAction={loginAction} className="flex-1" pendingText="Signing in...">
              Sign In
            </SubmitButton>
            <SubmitButton
              formAction={signupAction}
              variant="outline"
              className="flex-1"
              pendingText="Signing up..."
            >
              Sign Up
            </SubmitButton>
          </div>
        </form>

        <p className="text-muted-foreground text-center text-sm">
          <Link href="/forgot-password" className="text-foreground underline underline-offset-4">
            Forgot your password?
          </Link>
        </p>
      </div>
    </div>
  );
}
