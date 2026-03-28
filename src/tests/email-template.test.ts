import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    RESEND_API_KEY: undefined,
    EMAIL_FROM: "Test <noreply@test.com>",
  },
}));

vi.mock("resend", () => ({
  Resend: vi.fn(() => ({ emails: { send: vi.fn() } })),
}));

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

import { APP_NAME, renderEmail } from "@/lib/email-template";

describe("renderEmail", () => {
  it("produces HTML with DOCTYPE", () => {
    const html = renderEmail({ title: "Hello", body: "World" });
    expect(html).toContain("<!DOCTYPE html>");
  });

  it("title appears in output", () => {
    const html = renderEmail({ title: "My Title", body: "Some body text" });
    expect(html).toContain("My Title");
  });

  it("body appears in output", () => {
    const html = renderEmail({ title: "T", body: "My body paragraph" });
    expect(html).toContain("My body paragraph");
  });

  it("CTA button renders when ctaUrl and ctaText provided", () => {
    const html = renderEmail({
      title: "T",
      body: "B",
      ctaUrl: "https://example.com/reset",
      ctaText: "Reset Password",
    });
    expect(html).toContain("https://example.com/reset");
    expect(html).toContain("Reset Password");
  });

  it("CTA section absent when no ctaUrl", () => {
    const html = renderEmail({ title: "T", body: "B" });
    // No anchor tag linking to an action
    expect(html).not.toContain("<a ");
  });

  it("escapes XSS content in title", () => {
    const html = renderEmail({ title: "<script>alert(1)</script>", body: "B" });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("escapes XSS content in body", () => {
    const html = renderEmail({ title: "T", body: "<script>alert(1)</script>" });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("custom footerText appears in footer", () => {
    const html = renderEmail({ title: "T", body: "B", footerText: "My custom footer" });
    expect(html).toContain("My custom footer");
  });

  it("default footer appears when footerText not provided", () => {
    const html = renderEmail({ title: "T", body: "B" });
    // Should have some footer content
    expect(html).toContain("footer");
  });

  it("APP_NAME appears in header", () => {
    const html = renderEmail({ title: "T", body: "B" });
    expect(html).toContain(APP_NAME);
  });

  it("escapes XSS content in ctaUrl", () => {
    const html = renderEmail({
      title: "T",
      body: "B",
      ctaUrl: 'javascript:alert(1)"onmouseover="',
      ctaText: "Click",
    });
    expect(html).not.toContain('javascript:alert(1)"onmouseover="');
    expect(html).toContain("javascript:alert(1)");
    // The double-quote must be escaped
    expect(html).not.toContain('"onmouseover="');
  });

  it("escapes XSS content in ctaText", () => {
    const html = renderEmail({
      title: "T",
      body: "B",
      ctaUrl: "https://example.com",
      ctaText: "<b>Click Me</b>",
    });
    expect(html).not.toContain("<b>Click Me</b>");
    expect(html).toContain("&lt;b&gt;");
  });

  it("uses table-based layout with 600px max-width", () => {
    const html = renderEmail({ title: "T", body: "B" });
    expect(html).toContain("600");
    expect(html).toContain("<table");
  });
});

describe("APP_NAME", () => {
  it("is a non-empty string", () => {
    expect(typeof APP_NAME).toBe("string");
    expect(APP_NAME.length).toBeGreaterThan(0);
  });
});
