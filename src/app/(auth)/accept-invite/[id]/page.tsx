"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

type InviteStatus = "loading" | "accepting" | "success" | "error";

export default function AcceptInvitePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const [status, setStatus] = useState<InviteStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const invitationId = params.id;

  useEffect(() => {
    if (sessionLoading) return;

    if (!session) {
      router.replace(`/login?redirect=/accept-invite/${invitationId}`);
      return;
    }

    setStatus("accepting");

    authClient.organization
      .acceptInvitation({ invitationId })
      .then(({ error }) => {
        if (error) {
          setStatus("error");
          const message =
            (error as { message?: string }).message ??
            (error as { statusText?: string }).statusText ??
            "";
          const lowerMessage = message.toLowerCase();

          if (lowerMessage.includes("expire") || lowerMessage.includes("invalid")) {
            setErrorMessage("This invitation has expired or is no longer valid.");
          } else if (lowerMessage.includes("email")) {
            setErrorMessage("This invitation was sent to a different email address.");
          } else if (lowerMessage.includes("already")) {
            setErrorMessage("You have already accepted this invitation.");
          } else {
            setErrorMessage("Something went wrong. Please try again.");
          }
          return;
        }

        setStatus("success");
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      })
      .catch(() => {
        setStatus("error");
        setErrorMessage("Something went wrong. Please try again.");
      });
  }, [session, sessionLoading, invitationId, router]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            {status === "loading" || status === "accepting"
              ? "Accepting invitation..."
              : status === "success"
                ? "Invitation accepted"
                : "Unable to accept invitation"}
          </h1>
        </div>

        {(status === "loading" || status === "accepting") && (
          <div className="flex justify-center" data-testid="invite-loading">
            <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
          </div>
        )}

        {status === "success" && (
          <p
            className="text-muted-foreground text-center text-sm"
            data-testid="invite-success"
            role="status"
          >
            You have been added to the organization. Redirecting to dashboard...
          </p>
        )}

        {status === "error" && errorMessage && (
          <p
            className="text-destructive text-center text-sm"
            data-testid="invite-error"
            role="alert"
          >
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}
