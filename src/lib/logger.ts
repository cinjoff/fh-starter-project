import type { SeverityLevel } from "@sentry/nextjs";
import * as Sentry from "@sentry/nextjs";

export type LogAttributes = Record<string, string | number | boolean>;

/**
 * Maps our 6 log levels to the Sentry breadcrumb SeverityLevel.
 * - trace has no breadcrumb equivalent, mapped to "debug"
 * - warn maps to "warning" (breadcrumb convention)
 */
const breadcrumbLevel = {
  trace: "debug",
  debug: "debug",
  info: "info",
  warn: "warning",
  error: "error",
  fatal: "fatal",
} as const satisfies Record<string, SeverityLevel>;

type LogLevel = keyof typeof breadcrumbLevel;

function log(level: LogLevel, message: string, attrs?: LogAttributes): void {
  const logFn = Sentry.logger[level];
  if (typeof logFn === "function") {
    logFn(message, attrs);
  }

  Sentry.addBreadcrumb({
    message,
    level: breadcrumbLevel[level],
    category: "app",
    data: attrs,
  });
}

/**
 * Structured logger — sends to Sentry logs + breadcrumbs.
 * No console fallback; consoleLoggingIntegration handles dev visibility.
 */
export const logger = {
  trace: (message: string, attrs?: LogAttributes) => log("trace", message, attrs),
  debug: (message: string, attrs?: LogAttributes) => log("debug", message, attrs),
  info: (message: string, attrs?: LogAttributes) => log("info", message, attrs),
  warn: (message: string, attrs?: LogAttributes) => log("warn", message, attrs),
  error: (message: string, attrs?: LogAttributes) => log("error", message, attrs),
  fatal: (message: string, attrs?: LogAttributes) => log("fatal", message, attrs),
};
