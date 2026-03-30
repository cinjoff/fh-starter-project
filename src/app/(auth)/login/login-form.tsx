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

const TEST_ACCOUNTS = [
  { email: "alice@example.com", role: "owner" },
  { email: "bob@example.com", role: "member" },
  { email: "charlie@example.com", role: "member" },
] as const;

const DEFAULT_PASSWORD = "password123";

interface LoginFormProps {
  googleAuthEnabled?: boolean;
  isDev?: boolean;
  emailVerificationRequired?: boolean;
}

export function LoginForm({
  googleAuthEnabled = false,
  isDev = false,
  emailVerificationRequired = true,
}: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect") || "/dashboard";
  const redirectTo =
    rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/dashboard";
  const oauthError = searchParams.get("error");

  const [mode, setMode] = useState<Mode>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(isDev ? "alice@example.com" : "");
  const [password, setPassword] = useState(isDev ? DEFAULT_PASSWORD : "");
  const [error, setError] = useState<string | null>(
    oauthError === "access_denied"
      ? "Google sign-in was cancelled."
      : oauthError
        ? "Google sign-in failed. Please try again."
        : null,
  );
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [signedUpEmail, setSignedUpEmail] = useState("");

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
        setSignedUpEmail(email);
        setShowVerification(true);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: redirectTo,
      });
      Sentry.addBreadcrumb({
        category: "auth",
        message: "Google sign-in initiated",
        level: "info",
      });
    } catch {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const fillTestAccount = (accountEmail: string) => {
    setEmail(accountEmail);
    setPassword(DEFAULT_PASSWORD);
  };

  return (
    <div className="w-full space-y-6">
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

      {googleAuthEnabled && !showVerification && (
        <>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={googleLoading || loading}
            onClick={handleGoogleSignIn}
            data-testid="google-signin"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {googleLoading ? "Connecting..." : "Continue with Google"}
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background text-muted-foreground px-2">or</span>
            </div>
          </div>
        </>
      )}

      {showVerification ? (
        <div className="space-y-4" data-testid="verification-prompt">
          {emailVerificationRequired ? (
            <p className="text-muted-foreground text-center text-sm" role="status">
              Check your email to verify your account before signing in.
            </p>
          ) : (
            <>
              <p className="text-muted-foreground text-center text-sm" role="status">
                Account created! Email verification is automatic in local dev.
              </p>
              <Button
                type="button"
                className="w-full"
                onClick={() => {
                  setShowVerification(false);
                  setMode("sign-in");
                  setEmail(signedUpEmail);
                  setPassword("");
                  setError(null);
                }}
                data-testid="sign-in-now"
              >
                Sign in now
              </Button>
            </>
          )}
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

      {isDev && !showVerification && (
        <div
          className="rounded-md border border-dashed bg-muted/50 p-3"
          data-testid="dev-test-accounts"
        >
          <p className="text-muted-foreground mb-2 text-xs font-medium">Test accounts</p>
          <div className="space-y-1">
            {TEST_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                className="text-muted-foreground hover:text-foreground flex w-full items-center justify-between text-xs transition-colors"
                onClick={() => fillTestAccount(account.email)}
                data-testid={`test-account-${account.role}`}
              >
                <span className="font-mono">{account.email}</span>
                <span className="text-muted-foreground/60">{account.role}</span>
              </button>
            ))}
          </div>
          <p className="text-muted-foreground/60 mt-2 text-xs">
            Password: <span className="font-mono">password123</span>
          </p>
        </div>
      )}
    </div>
  );
}
