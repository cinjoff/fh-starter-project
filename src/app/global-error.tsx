"use client";

/** Root layout crash handler — last-resort error boundary when the main layout fails. */
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import "@/app/globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground font-sans">
        <div className="flex min-h-screen flex-col items-center justify-center gap-4">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground">
            {error.digest ? `Error reference: ${error.digest}` : "An unexpected error occurred."}
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
