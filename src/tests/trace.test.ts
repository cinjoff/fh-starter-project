import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTraceElapsed, getTraceId, withTrace } from "@/lib/trace";

describe("getTraceId", () => {
  it("returns 'no-trace' when called outside a withTrace context", () => {
    expect(getTraceId()).toBe("no-trace");
  });
});

describe("getTraceElapsed", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 0 outside a withTrace context", () => {
    expect(getTraceElapsed()).toBe(0);
  });

  it("returns positive elapsed ms inside withTrace after time passes", async () => {
    let elapsed: number | undefined;

    await withTrace(async () => {
      vi.advanceTimersByTime(100);
      elapsed = getTraceElapsed();
    });

    expect(elapsed).toBeGreaterThanOrEqual(100);
  });
});

describe("withTrace", () => {
  it("provides a UUID trace ID inside the context", async () => {
    let traceId: string | undefined;

    await withTrace(async () => {
      traceId = getTraceId();
    });

    expect(traceId).toBeDefined();
    expect(traceId).not.toBe("no-trace");
    // UUID v4 format
    expect(traceId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("generates a unique trace ID for each invocation", async () => {
    let id1: string | undefined;
    let id2: string | undefined;

    await withTrace(async () => {
      id1 = getTraceId();
    });
    await withTrace(async () => {
      id2 = getTraceId();
    });

    expect(id1).not.toBe(id2);
  });

  it("restores 'no-trace' after the context exits", async () => {
    await withTrace(async () => {
      // inside context
    });

    expect(getTraceId()).toBe("no-trace");
  });

  it("isolates trace IDs in concurrent contexts", async () => {
    let id1: string | undefined;
    let id2: string | undefined;

    await Promise.all([
      withTrace(async () => {
        // Yield to allow the other context to run
        await new Promise((resolve) => setTimeout(resolve, 0));
        id1 = getTraceId();
      }),
      withTrace(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
        id2 = getTraceId();
      }),
    ]);

    expect(id1).not.toBe("no-trace");
    expect(id2).not.toBe("no-trace");
    expect(id1).not.toBe(id2);
  });

  it("returns the value from the wrapped function", async () => {
    const result = await withTrace(async () => {
      return 42;
    });

    expect(result).toBe(42);
  });

  it("uses explicit existingTraceId when provided", async () => {
    const existingId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    let traceId: string | undefined;

    await withTrace(async () => {
      traceId = getTraceId();
    }, existingId);

    expect(traceId).toBe(existingId);
  });

  it("generates a UUID when existingTraceId is not provided", async () => {
    let traceId: string | undefined;

    await withTrace(async () => {
      traceId = getTraceId();
    });

    expect(traceId).toBeDefined();
    expect(traceId).not.toBe("no-trace");
    expect(traceId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });
});
