"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        if (error.status === 429) {
          toast.error("Too many attempts. Please wait and try again.");
        } else {
          toast.error("Something went wrong. Please try again.");
        }
        return;
      }

      setSubmitted(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
          <p className="text-muted-foreground text-sm">
            Enter your email to receive a password reset link
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4" data-testid="forgot-password-success">
            <p className="text-muted-foreground text-center text-sm" role="status">
              If an account exists with that email, you&apos;ll receive a reset link.
            </p>
            <Link href="/login" className="block">
              <Button variant="outline" className="w-full" data-testid="back-to-login">
                Back to sign in
              </Button>
            </Link>
          </div>
        ) : (
          <form data-testid="forgot-password-form" className="space-y-4" onSubmit={handleSubmit}>
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

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              data-testid="forgot-password-submit"
            >
              {loading ? "Sending..." : "Send reset link"}
            </Button>

            <p className="text-muted-foreground text-center text-sm">
              <Link
                href="/login"
                className="text-foreground underline underline-offset-4 hover:text-foreground/80"
                data-testid="back-to-login-link"
              >
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
