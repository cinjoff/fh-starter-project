/**
 * Next.js instrumentation hook — runs once when the server starts.
 * Initializes Sentry for server-side error tracking.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
}
