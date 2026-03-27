/**
 * Tests for extractEventFields and the tunnel route — verifies that the
 * Sentry local tunnel correctly parses all envelope item types
 * (errors, transactions, logs, sessions).
 */
import { describe, expect, it, vi } from "vitest";

// Mock better-sqlite3 so the sentry-local module can be imported without a real DB
vi.mock("better-sqlite3", () => {
  const MockDB = vi.fn(() => ({
    pragma: vi.fn(),
    exec: vi.fn(),
    prepare: vi.fn(() => ({ run: vi.fn(), get: vi.fn() })),
  }));
  return { default: MockDB };
});

const { extractEventFields } = await import("@/lib/sentry-local");

/** Build a minimal envelope: envelope-header + item-header + item-body. */
function makeEnvelope(
  itemHeader: Record<string, unknown>,
  itemBody: Record<string, unknown>,
): Uint8Array {
  const text = [JSON.stringify({}), JSON.stringify(itemHeader), JSON.stringify(itemBody)].join(
    "\n",
  );
  return new TextEncoder().encode(text);
}

// ---------------------------------------------------------------------------
// extractEventFields — core parsing logic
// ---------------------------------------------------------------------------

describe("extractEventFields", () => {
  it("extracts fields from a standard error event", () => {
    const envelope = makeEnvelope(
      { type: "event" },
      {
        event_id: "abc123",
        timestamp: 1700000000,
        level: "error",
        message: "Something broke",
        release: "1.0.0",
        environment: "development",
        tags: { page: "/home" },
      },
    );

    const result = extractEventFields(envelope);
    expect(result).not.toBeNull();
    expect(result?.event_id).toBe("abc123");
    expect(result?.level).toBe("error");
    expect(result?.message).toBe("Something broke");
    expect(result?.release).toBe("1.0.0");
    expect(result?.environment).toBe("development");
    expect(result?.tags).toBe(JSON.stringify({ page: "/home" }));
  });

  it("extracts exception message when no top-level message exists", () => {
    const envelope = makeEnvelope(
      { type: "event" },
      {
        event_id: "exc123",
        timestamp: 1700000000,
        exception: {
          values: [{ type: "TypeError", value: "Cannot read property 'x'" }],
        },
      },
    );

    const result = extractEventFields(envelope);
    expect(result).not.toBeNull();
    expect(result?.message).toBe("Cannot read property 'x'");
    expect(result?.exception).toContain("TypeError");
  });

  it("extracts fields from a transaction envelope", () => {
    const envelope = makeEnvelope(
      { type: "transaction" },
      {
        event_id: "txn456",
        timestamp: 1700000000,
        type: "transaction",
        transaction: "GET /api/users",
        spans: [{ op: "db", description: "SELECT * FROM users" }],
        contexts: { trace: { trace_id: "aaa" } },
      },
    );

    const result = extractEventFields(envelope);
    expect(result).not.toBeNull();
    expect(result?.event_id).toBe("txn456");
    expect(result?.type).toBe("transaction");
    expect(result?.message).toBe("GET /api/users");
    expect(result?.transaction_name).toBe("GET /api/users");
    expect(result?.level).toBe("info");
  });

  it("extracts fields from a log envelope with string body", () => {
    const envelope = makeEnvelope(
      { type: "log" },
      {
        timestamp: 1700000000,
        level: "warning",
        body: "User rate limited",
      },
    );

    const result = extractEventFields(envelope);
    expect(result).not.toBeNull();
    expect(result?.type).toBe("log");
    expect(result?.message).toBe("User rate limited");
    expect(result?.level).toBe("warning");
    expect(result?.event_id).toBeTruthy();
    expect(result?.event_id).toHaveLength(32);
  });

  it("extracts fields from a log envelope with stringValue body", () => {
    const envelope = makeEnvelope(
      { type: "log" },
      {
        timestamp: 1700000000,
        level: "info",
        body: { stringValue: "Database connected" },
      },
    );

    const result = extractEventFields(envelope);
    expect(result).not.toBeNull();
    expect(result?.message).toBe("Database connected");
  });

  it("generates event_id for items that lack one", () => {
    const envelope = makeEnvelope(
      { type: "event" },
      {
        timestamp: 1700000000,
        message: "No event_id here",
      },
    );

    const result = extractEventFields(envelope);
    expect(result).not.toBeNull();
    expect(result?.event_id).toBeTruthy();
    expect(result?.event_id).toHaveLength(32);
  });

  it("handles ISO timestamp strings", () => {
    const envelope = makeEnvelope(
      { type: "event" },
      {
        event_id: "ts123",
        timestamp: "2023-11-14T22:13:20.000Z",
        message: "ISO timestamp",
      },
    );

    const result = extractEventFields(envelope);
    expect(result).not.toBeNull();
    expect(result?.timestamp).toBe("2023-11-14T22:13:20.000Z");
  });

  it("defaults timestamp to now when missing", () => {
    const before = new Date().toISOString();
    const envelope = makeEnvelope(
      { type: "event" },
      {
        event_id: "notime",
        message: "Missing timestamp",
      },
    );

    const result = extractEventFields(envelope);
    expect(result).not.toBeNull();
    const ts = result?.timestamp ?? "";
    expect(ts >= before).toBe(true);
  });

  it("returns null for empty/invalid envelope", () => {
    const empty = new TextEncoder().encode("");
    expect(extractEventFields(empty)).toBeNull();

    const garbage = new TextEncoder().encode("not json\nalso not json");
    expect(extractEventFields(garbage)).toBeNull();
  });

  it("handles session items that have no event_id", () => {
    const envelope = makeEnvelope(
      { type: "session" },
      {
        sid: "sess-123",
        timestamp: 1700000000,
        status: "ok",
        init: true,
      },
    );

    const result = extractEventFields(envelope);
    expect(result).not.toBeNull();
    expect(result?.event_id).toHaveLength(32);
  });

  it("defaults level to 'info' for transactions", () => {
    const envelope = makeEnvelope(
      { type: "transaction" },
      {
        event_id: "txn-nolevel",
        timestamp: 1700000000,
        type: "transaction",
        transaction: "POST /upload",
        spans: [],
      },
    );

    const result = extractEventFields(envelope);
    expect(result?.level).toBe("info");
  });

  it("defaults level to 'error' for regular events", () => {
    const envelope = makeEnvelope(
      { type: "event" },
      {
        event_id: "evt-nolevel",
        timestamp: 1700000000,
        message: "No level specified",
      },
    );

    const result = extractEventFields(envelope);
    expect(result?.level).toBe("error");
  });
});
