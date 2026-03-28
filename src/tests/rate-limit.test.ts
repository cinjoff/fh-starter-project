import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRateLimiter } from "@/lib/rate-limit";

describe("createRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests under the limit", () => {
    const limiter = createRateLimiter({ maxRequests: 3, windowMs: 1000 });
    const result = limiter.check("user-1");
    expect(result.allowed).toBe(true);
  });

  it("returns correct remaining count", () => {
    const limiter = createRateLimiter({ maxRequests: 5, windowMs: 1000 });
    limiter.check("user-1");
    limiter.check("user-1");
    const result = limiter.check("user-1");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2); // 5 - 3 used = 2
  });

  it("blocks at the limit and returns remaining=0", () => {
    const limiter = createRateLimiter({ maxRequests: 3, windowMs: 1000 });
    limiter.check("user-1");
    limiter.check("user-1");
    limiter.check("user-1");
    const result = limiter.check("user-1"); // 4th request, over limit
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("returns a positive resetMs when blocked", () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 5000 });
    limiter.check("user-1");
    limiter.check("user-1");
    const result = limiter.check("user-1"); // blocked
    expect(result.allowed).toBe(false);
    expect(result.resetMs).toBeGreaterThan(0);
    expect(result.resetMs).toBeLessThanOrEqual(5000);
  });

  it("resets after the window expires", () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 1000 });
    limiter.check("user-1");
    limiter.check("user-1");
    // Both slots used — should be blocked
    expect(limiter.check("user-1").allowed).toBe(false);

    // Advance past the window
    vi.advanceTimersByTime(1001);

    // Should be allowed again
    const result = limiter.check("user-1");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1); // 1 used of 2, 1 remaining
  });

  it("tracks different keys independently", () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 1000 });
    limiter.check("user-1");
    limiter.check("user-1");
    // user-1 is at limit
    expect(limiter.check("user-1").allowed).toBe(false);

    // user-2 is unaffected
    const result = limiter.check("user-2");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });
});
