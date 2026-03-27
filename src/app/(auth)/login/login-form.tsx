"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

type Mode = "sign-in" | "sign-up";

export function LoginForm({ localAuthMode = false }: { localAuthMode?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect") || "/";
  const redirectTo =
    rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/";

  const [mode, setMode] = useState<Mode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "sign-in") {
        const { error: signInError } = await authClient.signIn.email({
          email,
          password,
          callbackURL: redirectTo,
        });

        if (signInError) {
          if (signInError.status === 429) {
            setError("Too many attempts. Please wait and try again.");
          } else {
            setError("Invalid email or password.");
          }
          return;
        }

        Sentry.addBreadcrumb({ category: "auth", message: "User signed in", level: "info" });
        router.push(redirectTo);
      } else {
        const { error: signUpError } = await authClient.signUp.email({
          name,
          email,
          password,
          callbackURL: redirectTo,
        });

        if (signUpError) {
          if (signUpError.status === 429) {
            setError("Too many attempts. Please wait and try again.");
          } else {
            setError("Sign up failed. Please try again.");
          }
          return;
        }

        Sentry.addBreadcrumb({ category: "auth", message: "User signed up", level: "info" });
        if (localAuthMode) {
          router.push(redirectTo);
        } else {
          setShowVerification(true);
        }
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        {localAuthMode && (
          <div
            data-testid="local-auth-banner"
            className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200"
          >
            Running in local auth mode. Set DATABASE_URL and RESEND_API_KEY in .env.local for
            production setup.
          </div>
        )}
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            {mode === "sign-in" ? "Sign in" : "Create account"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {mode === "sign-in"
              ? "Enter your credentials to continue"
              : "Fill in your details to get started"}
          </p>
        </div>

        {showVerification ? (
          <div className="space-y-4" data-testid="verification-prompt">
            <p className="text-muted-foreground text-center text-sm" role="status">
              Check your email to verify your account before signing in.
            </p>
            <button
              type="button"
              className="text-foreground underline underline-offset-4 hover:text-foreground/80 block w-full text-center text-sm"
              onClick={() => {
                setShowVerification(false);
                setMode("sign-in");
                setError(null);
              }}
              data-testid="back-to-signin"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form data-testid="login-form" className="space-y-4" onSubmit={handleSubmit}>
            {mode === "sign-up" && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Your name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="name-input"
                  aria-label="Name"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="email-input"
                aria-label="Email address"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === "sign-in" && (
                  <Link
                    href="/forgot-password"
                    className="text-muted-foreground hover:text-foreground text-xs"
                    data-testid="forgot-password-link"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="password-input"
                aria-label="Password"
              />
            </div>

            {error && (
              <p className="text-destructive text-sm" data-testid="auth-error" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading} data-testid="auth-submit">
              {loading
                ? mode === "sign-in"
                  ? "Signing in..."
                  : "Creating account..."
                : mode === "sign-in"
                  ? "Sign In"
                  : "Sign Up"}
            </Button>
          </form>
        )}

        {!showVerification && (
          <p className="text-muted-foreground text-center text-sm">
            {mode === "sign-in" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  className="text-foreground underline underline-offset-4 hover:text-foreground/80"
                  onClick={() => {
                    setMode("sign-up");
                    setError(null);
                  }}
                  data-testid="switch-to-signup"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-foreground underline underline-offset-4 hover:text-foreground/80"
                  onClick={() => {
                    setMode("sign-in");
                    setError(null);
                  }}
                  data-testid="switch-to-signin"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
