import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnauthorizedError } from "@/lib/api-errors";

// --- Mocks ---

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("@/lib/trace", () => ({
  getTraceId: vi.fn(() => "trace-123"),
  withTrace: vi.fn((fn: () => Promise<unknown>) => fn()),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/db", () => ({
  getPool: vi.fn(),
}));

// Import after mocks
import { auth } from "@/lib/auth";
import * as dbModule from "@/lib/db";
import { withAuth, withOrgAuth } from "@/lib/with-auth";

// Helper to make a fake Request
function makeRequest(method = "GET", path = "/api/test"): Request {
  return new Request(`http://localhost${path}`, { method });
}

// Helper to parse response JSON
async function parseJson(res: Response) {
  return res.json();
}

// Fake session
const fakeSession = {
  user: { id: "user-1", email: "test@example.com", name: "Test User" },
  session: { id: "session-1" },
};

describe("withAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no session", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const handler = vi.fn().mockResolvedValue({ hello: "world" });
    const wrappedHandler = withAuth(handler);
    const res = await wrappedHandler(makeRequest());

    expect(res.status).toBe(401);
    const body = await parseJson(res);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns ApiResponse envelope on success with trace_id", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(fakeSession as never);

    const handler = vi.fn().mockResolvedValue({ message: "ok" });
    const wrappedHandler = withAuth(handler);
    const res = await wrappedHandler(makeRequest());

    expect(res.status).toBe(200);
    const body = await parseJson(res);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ message: "ok" });
    expect(body.trace_id).toBe("trace-123");
  });

  it("passes AuthContext to handler", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(fakeSession as never);

    const handler = vi.fn().mockImplementation(async (_req, ctx) => {
      return { userId: ctx.user.id };
    });
    const wrappedHandler = withAuth(handler);
    const res = await wrappedHandler(makeRequest());

    expect(res.status).toBe(200);
    const body = await parseJson(res);
    expect(body.data.userId).toBe("user-1");
    expect(handler).toHaveBeenCalledWith(
      expect.any(Request),
      expect.objectContaining({
        user: expect.objectContaining({ id: "user-1", email: "test@example.com" }),
        traceId: "trace-123",
      }),
    );
  });

  it("catches ApiError and returns correct status and code", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(fakeSession as never);

    const handler = vi.fn().mockRejectedValue(new UnauthorizedError("Token expired"));
    const wrappedHandler = withAuth(handler);
    const res = await wrappedHandler(makeRequest());

    expect(res.status).toBe(401);
    const body = await parseJson(res);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
    expect(body.error.message).toBe("Token expired");
  });

  it("rethrows non-ApiError after logging", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(fakeSession as never);

    const { logger } = await import("@/lib/logger");

    const unexpectedError = new Error("database exploded");
    const handler = vi.fn().mockRejectedValue(unexpectedError);
    const wrappedHandler = withAuth(handler);

    await expect(wrappedHandler(makeRequest())).rejects.toThrow("database exploded");
    expect(logger.error).toHaveBeenCalledWith(
      "Unhandled API error",
      expect.objectContaining({ method: "GET", path: "/api/test" }),
    );
  });
});

describe("withOrgAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when getPool() throws (database unavailable)", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(fakeSession as never);
    vi.mocked(dbModule.getPool).mockImplementation(() => {
      throw new Error("no DATABASE_URL");
    });

    const handler = vi.fn().mockResolvedValue({ data: "ok" });
    const wrappedHandler = withOrgAuth("member", handler);
    await expect(
      wrappedHandler(makeRequest(), {
        params: Promise.resolve({ orgId: "org-1" }),
      }),
    ).rejects.toThrow("no DATABASE_URL");
  });

  it("returns 403 when user is not a member of the org", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(fakeSession as never);
    vi.mocked(dbModule.getPool).mockReturnValue({
      query: vi.fn().mockResolvedValue({ rows: [] }),
    } as never);

    const handler = vi.fn().mockResolvedValue({ data: "ok" });
    const wrappedHandler = withOrgAuth("member", handler);
    const res = await wrappedHandler(makeRequest(), {
      params: Promise.resolve({ orgId: "org-1" }),
    });

    expect(res.status).toBe(403);
    const body = await parseJson(res);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("returns 403 when role is insufficient", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(fakeSession as never);
    vi.mocked(dbModule.getPool).mockReturnValue({
      query: vi.fn().mockResolvedValue({
        rows: [{ role: "member", userId: "user-1", organizationId: "org-1" }],
      }),
    } as never);

    const handler = vi.fn().mockResolvedValue({ data: "ok" });
    const wrappedHandler = withOrgAuth("admin", handler); // requires admin, user is member
    const res = await wrappedHandler(makeRequest(), {
      params: Promise.resolve({ orgId: "org-1" }),
    });

    expect(res.status).toBe(403);
    const body = await parseJson(res);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("passes OrgAuthContext to handler when authorized", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(fakeSession as never);
    vi.mocked(dbModule.getPool).mockReturnValue({
      query: vi.fn().mockResolvedValue({
        rows: [{ role: "admin", userId: "user-1", organizationId: "org-1" }],
      }),
    } as never);

    const handler = vi.fn().mockImplementation(async (_req, ctx) => {
      return {
        orgId: ctx.org.id,
        role: ctx.member.role,
        userId: ctx.user.id,
      };
    });
    const wrappedHandler = withOrgAuth("member", handler);
    const res = await wrappedHandler(makeRequest(), {
      params: Promise.resolve({ orgId: "org-1" }),
    });

    expect(res.status).toBe(200);
    const body = await parseJson(res);
    expect(body.success).toBe(true);
    expect(body.data.orgId).toBe("org-1");
    expect(body.data.role).toBe("admin");
    expect(body.data.userId).toBe("user-1");
  });

  it("returns 401 when no session", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    vi.mocked(dbModule.getPool).mockReturnValue({ query: vi.fn() } as never);

    const handler = vi.fn().mockResolvedValue({});
    const wrappedHandler = withOrgAuth("member", handler);
    const res = await wrappedHandler(makeRequest(), {
      params: Promise.resolve({ orgId: "org-1" }),
    });

    expect(res.status).toBe(401);
  });
});
