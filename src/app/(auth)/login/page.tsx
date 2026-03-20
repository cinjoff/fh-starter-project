"use client";

import { useActionState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/lib/actions/types";
import { createClient } from "@/lib/supabase/client";
import { login, signup } from "./actions";

const initialState: ActionState = { success: false };

export default function LoginPage() {
  const [loginState, loginAction] = useActionState(login, initialState);
  const [signupState, signupAction] = useActionState(signup, initialState);
  const hasOAuth = useMemo(() => createClient() !== null, []);

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

  const handleOAuth = async (provider: "google" | "github") => {
    const supabase = createClient();
    if (!supabase) return;

    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

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

        {hasOAuth && (
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="border-border w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background text-muted-foreground px-2">Or continue with</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => handleOAuth("google")}
                aria-label="Sign in with Google"
              >
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => handleOAuth("github")}
                aria-label="Sign in with GitHub"
              >
                GitHub
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
