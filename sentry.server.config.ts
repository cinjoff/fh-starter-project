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
  import("@sentry/core").then(({ makeOfflineTransport }) => {
    import("@/lib/sentry-local").then(({ createLocalSentryStore }) => {
      Sentry.init({
        dsn: process.env.SENTRY_DSN || "https://local@localhost/1",
        transport: makeOfflineTransport(Sentry.makeNodeTransport),
        transportOptions: {
          createStore: createLocalSentryStore,
          shouldStore: () => true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      });
    });
  });
} else if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN });
}
