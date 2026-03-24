/**
 * Client-side Sentry initialization.
 *
 * - NEXT_PUBLIC_SENTRY_LOCAL=true → tunnel errors to /api/sentry-local
 * - NEXT_PUBLIC_SENTRY_DSN set    → send errors to Sentry.io
 * - Neither                       → Sentry disabled on client
 */
import * as Sentry from "@sentry/nextjs";

if (process.env.NEXT_PUBLIC_SENTRY_LOCAL === "true") {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://local@localhost/1",
    tunnel: "/api/sentry-local",
  });
} else if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
