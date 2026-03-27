import * as Sentry from "@sentry/nextjs";

/**
 * Next.js instrumentation hook — runs once when the server starts.
 * Initializes Sentry for server-side error tracking.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

/**
 * Server-side error hook — captures unhandled request errors to Sentry.
 * The SDK automatically adds route context tags.
 */
export const onRequestError = Sentry.captureRequestError;
