import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock next/server before importing proxy
const headers = new Map<string, string>();
const mockResponse = {
  headers: {
    set: (k: string, v: string) => headers.set(k, v),
    get: (k: string) => headers.get(k),
  },
};

vi.mock("next/server", () => ({
  NextResponse: {
    next: vi.fn(() => mockResponse),
  },
}));

describe("proxy", () => {
  beforeEach(() => {
    headers.clear();
    vi.stubEnv("NODE_ENV", "production");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("sets all expected security headers", async () => {
    const { proxy } = await import("@/proxy");
    const fakeRequest = {} as Parameters<typeof proxy>[0];

    await proxy(fakeRequest);

    expect(headers.get("Strict-Transport-Security")).toBe(
      "max-age=63072000; includeSubDomains; preload",
    );
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("Permissions-Policy")).toBe("camera=(), microphone=(), geolocation=()");
    expect(headers.get("Content-Security-Policy")).toBeTruthy();
  });

  it("omits unsafe-eval in CSP when NODE_ENV is not development", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { proxy } = await import("@/proxy");
    const fakeRequest = {} as Parameters<typeof proxy>[0];

    await proxy(fakeRequest);

    const csp = headers.get("Content-Security-Policy") ?? "";
    expect(csp).not.toContain("unsafe-eval");
  });

  it("includes unsafe-eval in CSP when NODE_ENV is development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.resetModules();
    const { proxy } = await import("@/proxy");
    const fakeRequest = {} as Parameters<typeof proxy>[0];

    await proxy(fakeRequest);

    const csp = headers.get("Content-Security-Policy") ?? "";
    expect(csp).toContain("'unsafe-eval'");
  });

  it("includes Sentry DSN origin in connect-src when set", async () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "https://key@o123.ingest.sentry.io/456");
    vi.resetModules();
    const { proxy } = await import("@/proxy");
    const fakeRequest = {} as Parameters<typeof proxy>[0];

    await proxy(fakeRequest);

    const csp = headers.get("Content-Security-Policy") ?? "";
    expect(csp).toContain("https://o123.ingest.sentry.io");
  });

  it("does not include extra connect-src origins when no Sentry DSN", async () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "");
    vi.resetModules();
    const { proxy } = await import("@/proxy");
    const fakeRequest = {} as Parameters<typeof proxy>[0];

    await proxy(fakeRequest);

    const csp = headers.get("Content-Security-Policy") ?? "";
    // connect-src should only have 'self'
    const connectSrcMatch = csp.match(/connect-src ([^;]+)/);
    expect(connectSrcMatch?.[1]?.trim()).toBe("'self'");
  });
});
