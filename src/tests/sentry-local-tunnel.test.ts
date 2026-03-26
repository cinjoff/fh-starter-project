import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mock better-sqlite3 and the sentry-local store
// ---------------------------------------------------------------------------

const mockPush = vi.fn();

vi.mock("@/lib/sentry-local", () => ({
  createLocalSentryStore: () => ({
    push: mockPush,
    unshift: mockPush,
    shift: vi.fn(),
  }),
}));

// We also need NextResponse — use the real one
// (happy-dom environment provides enough globals for this)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a Sentry envelope body from header + item-header + payload lines. */
function buildEnvelope(
  header: Record<string, unknown>,
  itemHeader: Record<string, unknown>,
  payload: Record<string, unknown>,
): string {
  return [JSON.stringify(header), JSON.stringify(itemHeader), JSON.stringify(payload)].join("\n");
}

/** Import the POST handler fresh (env vars may change between tests). */
async function importPost() {
  const mod = await import("@/app/api/sentry-local/route");
  return mod.POST;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("/api/sentry-local tunnel", () => {
  beforeEach(() => {
    vi.resetModules();
    mockPush.mockReset();
    // Default: local mode enabled
    process.env.SENTRY_LOCAL = "true";
    process.env.NODE_ENV = "development";
  });

  // -----------------------------------------------------------------------
  // Feature-gating
  // -----------------------------------------------------------------------

  it("returns 404 when SENTRY_LOCAL is not 'true'", async () => {
    process.env.SENTRY_LOCAL = "false";
    const POST = await importPost();
    const res = await POST(
      new Request("http://localhost/api/sentry-local", {
        method: "POST",
        body: buildEnvelope(
          { dsn: "https://key@o0.ingest.sentry.io/0" },
          { type: "event" },
          { event_id: "abc123", message: "boom" },
        ),
      }),
    );
    expect(res.status).toBe(404);
    expect(mockPush).not.toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Error envelopes
  // -----------------------------------------------------------------------

  it("stores error envelopes", async () => {
    const POST = await importPost();
    const body = buildEnvelope(
      { dsn: "https://key@o0.ingest.sentry.io/0" },
      { type: "event" },
      { event_id: "err-1", exception: { values: [{ type: "Error", value: "fail" }] } },
    );

    const res = await POST(
      new Request("http://localhost/api/sentry-local", {
        method: "POST",
        body,
      }),
    );

    expect(res.status).toBe(200);
    expect(mockPush).toHaveBeenCalled();
    // The envelope passed to push should be a Uint8Array
    const arg = (mockPush as Mock).mock.calls[0][0] as Uint8Array;
    expect(arg).toBeInstanceOf(Uint8Array);
  });

  // -----------------------------------------------------------------------
  // Transaction envelopes
  // -----------------------------------------------------------------------

  it("stores transaction envelopes", async () => {
    const POST = await importPost();
    const body = buildEnvelope(
      { dsn: "https://key@o0.ingest.sentry.io/0" },
      { type: "transaction" },
      {
        event_id: "txn-1",
        type: "transaction",
        transaction: "/api/health",
        start_timestamp: 1700000000,
        timestamp: 1700000001,
      },
    );

    const res = await POST(
      new Request("http://localhost/api/sentry-local", {
        method: "POST",
        body,
      }),
    );

    expect(res.status).toBe(200);
    expect(mockPush).toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Log envelopes
  // -----------------------------------------------------------------------

  it("stores log envelopes", async () => {
    const POST = await importPost();
    const body = buildEnvelope(
      { dsn: "https://key@o0.ingest.sentry.io/0" },
      { type: "log" },
      {
        event_id: "log-1",
        level: "info",
        message: "User signed in",
      },
    );

    const res = await POST(
      new Request("http://localhost/api/sentry-local", {
        method: "POST",
        body,
      }),
    );

    expect(res.status).toBe(200);
    expect(mockPush).toHaveBeenCalled();
  });

  // -----------------------------------------------------------------------
  // Malformed lines
  // -----------------------------------------------------------------------

  it("skips malformed envelope lines without error", async () => {
    const POST = await importPost();
    // Envelope format: line 0 = envelope header, then item-header/item-body pairs.
    // Insert malformed item-header lines — they should be skipped — followed by a valid pair.
    const body = [
      JSON.stringify({ dsn: "https://key@o0.ingest.sentry.io/0" }), // envelope header
      "{broken json{{", // malformed item header — skipped
      "this body is also skipped", // would-be body for malformed header
      JSON.stringify({ type: "event" }), // valid item header
      JSON.stringify({ event_id: "ok-1", message: "valid" }), // valid item body
    ].join("\n");

    const res = await POST(
      new Request("http://localhost/api/sentry-local", {
        method: "POST",
        body,
      }),
    );

    expect(res.status).toBe(200);
    // Should still store the valid envelope
    expect(mockPush).toHaveBeenCalled();
  });

  it("returns 200 even when all lines are malformed", async () => {
    const POST = await importPost();
    const body = "garbage\n{{{bad\nnope";

    const res = await POST(
      new Request("http://localhost/api/sentry-local", {
        method: "POST",
        body,
      }),
    );

    expect(res.status).toBe(200);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
