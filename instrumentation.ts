import type { Instrumentation } from "next";

/**
 * Next.js instrumentation hook — runs once when the server starts.
 * Initializes Sentry for server-side error tracking.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
}

/**
 * Server-side error hook — captures unhandled request errors to Sentry
 * with route context tags for easier debugging.
 */
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const Sentry = await import("@sentry/nextjs");
  Sentry.withScope((scope) => {
    scope.setTag("routerKind", context.routerKind);
    scope.setTag("routePath", context.routePath);
    scope.setTag("routeType", context.routeType);
    if (context.renderSource) {
      scope.setTag("renderSource", context.renderSource);
    }
    scope.setExtra("request", {
      path: request.path,
      method: request.method,
    });
    Sentry.captureException(err);
  });
};
