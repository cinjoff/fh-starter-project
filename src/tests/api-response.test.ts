import { describe, expect, it } from "vitest";
import type { PaginationMeta } from "@/lib/api-response";
import { apiError, ok } from "@/lib/api-response";

describe("ok()", () => {
  it("produces a success envelope with data", () => {
    const result = ok({ id: 1, name: "Alice" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ id: 1, name: "Alice" });
    }
  });

  it("includes trace_id from context when not explicitly provided", () => {
    const result = ok("hello");
    expect(result.success).toBe(true);
    expect(typeof result.trace_id).toBe("string");
  });

  it("includes trace_id when provided", () => {
    const result = ok("hello", { traceId: "abc-123" });
    expect(result.success).toBe(true);
    expect(result.trace_id).toBe("abc-123");
  });

  it("includes pagination metadata when provided", () => {
    const pagination: PaginationMeta = { page: 2, per_page: 10, total: 50, total_pages: 5 };
    const result = ok([1, 2, 3], { pagination });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.pagination).toEqual(pagination);
    }
  });

  it("does not include pagination when not provided", () => {
    const result = ok([]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.pagination).toBeUndefined();
    }
  });
});

describe("apiError()", () => {
  it("produces an error envelope with code and message", () => {
    const result = apiError("NOT_FOUND", "Resource not found");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("NOT_FOUND");
      expect(result.error.message).toBe("Resource not found");
    }
  });

  it("includes trace_id from context when not explicitly provided", () => {
    const result = apiError("ERR", "msg");
    expect(typeof result.trace_id).toBe("string");
  });

  it("includes trace_id when provided", () => {
    const result = apiError("ERR", "msg", { traceId: "xyz-789" });
    expect(result.success).toBe(false);
    expect(result.trace_id).toBe("xyz-789");
  });

  it("includes details when provided", () => {
    const details = { field: "email", reason: "invalid" };
    const result = apiError("VALIDATION", "Invalid input", { details });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.details).toEqual(details);
    }
  });

  it("does not include details when not provided", () => {
    const result = apiError("ERR", "msg");
    if (!result.success) {
      expect(result.error.details).toBeUndefined();
    }
  });
});
