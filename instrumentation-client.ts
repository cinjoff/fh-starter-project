/**
 * Client-side Sentry initialization.
 *
 * - NEXT_PUBLIC_SENTRY_LOCAL=true → tunnel errors to /api/sentry-local
 * - NEXT_PUBLIC_SENTRY_DSN set    → send errors to Sentry.io
 * - Neither                       → Sentry disabled on client
 */

import type { Log } from "@sentry/nextjs";
import * as Sentry from "@sentry/nextjs";

const sharedOptions = {
  enableLogs: true,
  tracesSampleRate: process.env.NEXT_PUBLIC_SENTRY_LOCAL === "true" ? 1.0 : 0.1,
  sendDefaultPii: true,
  environment: process.env.NODE_ENV,
  integrations: [Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] })],
  beforeSendLog: (log: Log): Log | null => {
    if (process.env.NODE_ENV === "production" && (log.level === "trace" || log.level === "debug")) {
      return null;
    }
    return log;
  },
} satisfies Partial<Sentry.BrowserOptions>;

if (process.env.NEXT_PUBLIC_SENTRY_LOCAL === "true") {
  Sentry.init({
    ...sharedOptions,
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://local@localhost/1",
    tunnel: "/api/sentry-local",
  });
} else if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    ...sharedOptions,
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
