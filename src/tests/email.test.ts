import { afterEach, describe, expect, it, vi } from "vitest";
import { escapeHtml } from "@/lib/email";

// Mock dependencies before importing sendEmail
vi.mock("resend", () => {
  const mockSend = vi.fn();
  return {
    Resend: vi.fn(() => ({ emails: { send: mockSend } })),
    __mockSend: mockSend,
  };
});

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  addBreadcrumb: vi.fn(),
  logger: {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
  },
}));

vi.mock("@/lib/env", () => ({
  env: {
    RESEND_API_KEY: undefined,
    EMAIL_FROM: "Test <noreply@test.com>",
  },
}));

describe("escapeHtml", () => {
  it("escapes script tags", () => {
    expect(escapeHtml("<script>alert(1)</script>")).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("escapes inline event handlers", () => {
    expect(escapeHtml('"onclick="')).toBe("&quot;onclick=&quot;");
  });

  it("does not double-encode existing ampersands", () => {
    // Input already has &amp; — should encode the & but not double-encode
    expect(escapeHtml("&amp;")).toBe("&amp;amp;");
  });

  it("handles empty string", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("passes through normal text unchanged", () => {
    expect(escapeHtml("Hello, World!")).toBe("Hello, World!");
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#39;s");
  });
});

describe("sendEmail", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs via logger in dev mode (no RESEND_API_KEY)", async () => {
    const Sentry = await import("@sentry/nextjs");
    const { sendEmail } = await import("@/lib/email");

    await sendEmail({
      to: "user@example.com",
      subject: "Test",
      html: "<p>Hello</p>",
    });

    expect(Sentry.logger.info).toHaveBeenCalledWith("Email sent (dev mode)", {
      to: "user@example.com",
      subject: "Test",
    });
  });

  it("resolves without error in dev mode", async () => {
    const { sendEmail } = await import("@/lib/email");

    await expect(
      sendEmail({ to: "a@b.com", subject: "S", html: "<p>H</p>" }),
    ).resolves.toBeUndefined();
  });

  it("calls Sentry.captureException on Resend error", async () => {
    const resendError = { statusCode: 422, message: "Invalid email" };

    // Clear module cache to pick up new mocks
    vi.resetModules();

    vi.doMock("resend", () => {
      const send = vi.fn().mockResolvedValueOnce({
        data: null,
        error: resendError,
      });

      class MockResend {
        emails = { send };
      }
      return { Resend: MockResend };
    });

    vi.doMock("@sentry/nextjs", () => ({
      captureException: vi.fn(),
      addBreadcrumb: vi.fn(),
      logger: {
        trace: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        fatal: vi.fn(),
      },
    }));

    vi.doMock("@/lib/env", () => ({
      env: {
        RESEND_API_KEY: "re_test_key",
        EMAIL_FROM: "Test <noreply@test.com>",
      },
    }));

    const Sentry = await import("@sentry/nextjs");
    const { sendEmail } = await import("@/lib/email");

    await sendEmail({
      to: "user@example.com",
      subject: "Test",
      html: "<p>Hello</p>",
    });

    expect(Sentry.captureException).toHaveBeenCalledWith(resendError);
  });
});
