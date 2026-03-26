import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  logger: {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
  },
  addBreadcrumb: vi.fn(),
}));

import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/logger";

const sentryLogger = Sentry.logger as unknown as Record<string, ReturnType<typeof vi.fn>>;
const mockAddBreadcrumb = Sentry.addBreadcrumb as ReturnType<typeof vi.fn>;

const levels = ["trace", "debug", "info", "warn", "error", "fatal"] as const;

const expectedBreadcrumbLevel: Record<string, string> = {
  trace: "debug",
  debug: "debug",
  info: "info",
  warn: "warning",
  error: "error",
  fatal: "fatal",
};

describe("logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe.each(levels)("%s", (level) => {
    it("calls Sentry.logger with message and attrs", () => {
      const attrs = { userId: "u1", count: 42, active: true };
      logger[level]("test message", attrs);

      expect(sentryLogger[level]).toHaveBeenCalledWith("test message", attrs);
    });

    it("calls Sentry.logger with message only when no attrs", () => {
      logger[level]("bare message");

      expect(sentryLogger[level]).toHaveBeenCalledWith("bare message", undefined);
    });

    it("adds a breadcrumb with correct level mapping", () => {
      const attrs = { key: "value" };
      logger[level]("breadcrumb msg", attrs);

      expect(mockAddBreadcrumb).toHaveBeenCalledWith({
        message: "breadcrumb msg",
        level: expectedBreadcrumbLevel[level],
        category: "app",
        data: attrs,
      });
    });

    it("adds a breadcrumb without data when attrs omitted", () => {
      logger[level]("no attrs");

      expect(mockAddBreadcrumb).toHaveBeenCalledWith({
        message: "no attrs",
        level: expectedBreadcrumbLevel[level],
        category: "app",
        data: undefined,
      });
    });
  });

  describe("attrs pass-through", () => {
    it("passes string, number, and boolean attrs correctly", () => {
      const attrs = { name: "alice", age: 30, verified: false };
      logger.info("user event", attrs);

      expect(sentryLogger.info).toHaveBeenCalledWith("user event", attrs);
      expect(mockAddBreadcrumb).toHaveBeenCalledWith(expect.objectContaining({ data: attrs }));
    });

    it("passes empty attrs object", () => {
      logger.warn("empty attrs", {});

      expect(sentryLogger.warn).toHaveBeenCalledWith("empty attrs", {});
      expect(mockAddBreadcrumb).toHaveBeenCalledWith(expect.objectContaining({ data: {} }));
    });
  });

  describe("graceful handling when Sentry is not initialized", () => {
    it("does not throw when Sentry.logger methods are undefined", () => {
      const original = sentryLogger.info;
      delete sentryLogger.info;

      expect(() => logger.info("should not throw")).not.toThrow();

      sentryLogger.info = original;
    });

    it("still adds breadcrumb even when logger method is missing", () => {
      const original = sentryLogger.error;
      delete sentryLogger.error;

      logger.error("fallback breadcrumb");

      expect(mockAddBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({ message: "fallback breadcrumb", level: "error" }),
      );

      sentryLogger.error = original;
    });
  });
});
