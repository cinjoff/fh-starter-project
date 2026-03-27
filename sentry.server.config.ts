/**
 * Server-side Sentry configuration.
 *
 * - SENTRY_LOCAL=true → events stored in .sentry-local/events.db (SQLite)
 * - SENTRY_DSN set    → events sent to Sentry.io
 * - Neither           → Sentry disabled
 *
 * Loaded by instrumentation.ts when NEXT_RUNTIME === "nodejs".
 */
import * as Sentry from "@sentry/nextjs";

if (process.env.SENTRY_LOCAL === "true") {
  // Dynamic imports: better-sqlite3 is a native addon not available in production.
  const { makeOfflineTransport } = await import("@sentry/core");
  const { createLocalSentryStore } = await import("@/lib/sentry-local");
  Sentry.init({
    dsn: process.env.SENTRY_DSN || "https://local@localhost/1",
    transport: makeOfflineTransport(Sentry.makeNodeTransport),
    transportOptions: {
      createStore: createLocalSentryStore,
      shouldStore: () => true,
    } as Record<string, unknown>,
    enableLogs: true,
    tracesSampleRate: 1.0,
    sendDefaultPii: true,
    environment: process.env.NODE_ENV,
  });
} else if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    enableLogs: true,
    tracesSampleRate: 0.1,
    sendDefaultPii: true,
    environment: process.env.NODE_ENV,
  });
}
