import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// --- Mocks (must be before imports) ---

vi.mock("@/lib/auth", () => ({}));

vi.mock("@/lib/db", () => ({
  getPool: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  env: {
    RESEND_API_KEY: undefined,
    DATABASE_URL: "postgresql://localhost/test",
  },
}));

vi.mock("better-sqlite3", () => {
  const mockDb = {
    prepare: vi.fn(),
    close: vi.fn(),
  };
  return { default: vi.fn(() => mockDb) };
});

import Database from "better-sqlite3";
import { OrgTree } from "@/app/(dev)/dev/org-tree";
import { RecentErrors } from "@/app/(dev)/dev/recent-errors";
import { AuthModeCard, DatabaseCard, OrgCountCard } from "@/app/(dev)/dev/status-cards";
// Import after mocks
import * as dbModule from "@/lib/db";

// ---------------------------------------------------------------------------
// AuthModeCard
// ---------------------------------------------------------------------------

describe("AuthModeCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows Postgres mode text", async () => {
    const jsx = await AuthModeCard();
    render(jsx);

    expect(screen.getByText(/Postgres/i)).toBeTruthy();
  });

  it("shows email verification inactive when RESEND_API_KEY is not set", async () => {
    const jsx = await AuthModeCard();
    render(jsx);

    expect(screen.getByText(/email verification/i)).toBeTruthy();
  });

  it("renders AuthMode card title", async () => {
    const jsx = await AuthModeCard();
    render(jsx);

    expect(screen.getByText(/Auth Mode/i)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// DatabaseCard
// ---------------------------------------------------------------------------

describe("DatabaseCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows Postgres version when pool is available", async () => {
    vi.mocked(dbModule.getPool).mockReturnValue({
      query: vi.fn().mockResolvedValue({
        rows: [{ version: "PostgreSQL 15.3 on x86_64" }],
      }),
    } as never);

    const jsx = await DatabaseCard();
    render(jsx);

    expect(screen.getByText(/PostgreSQL/i)).toBeTruthy();
  });

  it("shows connection error when query fails", async () => {
    vi.mocked(dbModule.getPool).mockReturnValue({
      query: vi.fn().mockRejectedValue(new Error("connection refused")),
    } as never);

    const jsx = await DatabaseCard();
    render(jsx);

    expect(screen.getByText(/connection error/i)).toBeTruthy();
  });

  it("renders Database card title", async () => {
    vi.mocked(dbModule.getPool).mockReturnValue({
      query: vi.fn().mockResolvedValue({
        rows: [{ version: "PostgreSQL 15.3" }],
      }),
    } as never);

    const jsx = await DatabaseCard();
    render(jsx);

    expect(screen.getByText(/Database/i)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// OrgCountCard
// ---------------------------------------------------------------------------

describe("OrgCountCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows org count and member count when pool is available", async () => {
    vi.mocked(dbModule.getPool).mockReturnValue({
      query: vi
        .fn()
        .mockResolvedValueOnce({ rows: [{ count: "3" }] })
        .mockResolvedValueOnce({ rows: [{ count: "12" }] }),
    } as never);

    const jsx = await OrgCountCard();
    render(jsx);

    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
  });

  it("renders Organizations card title", async () => {
    vi.mocked(dbModule.getPool).mockReturnValue({
      query: vi
        .fn()
        .mockResolvedValueOnce({ rows: [{ count: "0" }] })
        .mockResolvedValueOnce({ rows: [{ count: "0" }] }),
    } as never);

    const jsx = await OrgCountCard();
    render(jsx);

    expect(screen.getAllByText(/Organizations/i).length).toBeGreaterThan(0);
  });

  it("shows error state when query fails", async () => {
    vi.mocked(dbModule.getPool).mockReturnValue({
      query: vi.fn().mockRejectedValue(new Error("relation does not exist")),
    } as never);

    const jsx = await OrgCountCard();
    render(jsx);

    expect(screen.getByText(/Query error/i)).toBeTruthy();
    expect(screen.getByText(/relation does not exist/i)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// RecentErrors
// ---------------------------------------------------------------------------

describe("RecentErrors", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    cleanup();
  });

  it("shows disabled message when SENTRY_LOCAL is not set", async () => {
    delete process.env.SENTRY_LOCAL;

    const jsx = await RecentErrors();
    render(jsx);

    expect(screen.getByText(/Local Sentry capture is disabled/i)).toBeTruthy();
  });

  it("shows 'No events database found' when DB file does not exist", async () => {
    process.env.SENTRY_LOCAL = "true";
    vi.mocked(Database).mockImplementation(() => {
      throw new Error("unable to open database file");
    });

    const jsx = await RecentErrors();
    render(jsx);

    expect(screen.getByText(/No events database found/i)).toBeTruthy();
  });

  it("renders table rows when DB has events", async () => {
    process.env.SENTRY_LOCAL = "true";
    const mockPrepare = vi.fn().mockReturnValue({
      all: () => [
        { timestamp: "2026-03-28T10:00:00Z", level: "error", message: "Test error occurred" },
        { timestamp: "2026-03-28T09:00:00Z", level: "warning", message: "Test warning" },
      ],
    });
    vi.mocked(Database).mockImplementation(function MockDatabase() {
      return { prepare: mockPrepare, close: vi.fn() } as never;
    });

    const jsx = await RecentErrors();
    render(jsx);

    expect(screen.getByText(/Test error occurred/i)).toBeTruthy();
    expect(screen.getByText(/Test warning/i)).toBeTruthy();
  });

  it("shows empty state when DB has no events", async () => {
    process.env.SENTRY_LOCAL = "true";
    const mockPrepare = vi.fn().mockReturnValue({ all: () => [] });
    vi.mocked(Database).mockImplementation(function MockDatabase() {
      return { prepare: mockPrepare, close: vi.fn() } as never;
    });

    const jsx = await RecentErrors();
    render(jsx);

    expect(screen.getByText(/No errors recorded yet/i)).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// OrgTree
// ---------------------------------------------------------------------------

describe("OrgTree", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows org names and member names with roles", async () => {
    vi.mocked(dbModule.getPool).mockReturnValue({
      query: vi
        .fn()
        .mockResolvedValueOnce({
          rows: [{ id: "org-1", name: "Acme Corp", slug: "acme" }],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              userId: "u-1",
              organizationId: "org-1",
              role: "owner",
              userName: "Alice",
              userEmail: "alice@acme.com",
            },
            {
              userId: "u-2",
              organizationId: "org-1",
              role: "member",
              userName: null,
              userEmail: "bob@acme.com",
            },
          ],
        }),
    } as never);

    const jsx = await OrgTree();
    render(jsx);

    expect(screen.getByText(/Acme Corp/)).toBeTruthy();
    expect(screen.getByText(/Alice/)).toBeTruthy();
    expect(screen.getByText(/bob@acme.com/)).toBeTruthy();
    expect(screen.getByText(/owner/)).toBeTruthy();
    expect(screen.getByText(/member/)).toBeTruthy();
  });

  it("shows empty state when no orgs exist", async () => {
    vi.mocked(dbModule.getPool).mockReturnValue({
      query: vi.fn().mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] }),
    } as never);

    const jsx = await OrgTree();
    render(jsx);

    expect(screen.getByText(/No organizations found/i)).toBeTruthy();
  });

  it("shows error state when query fails", async () => {
    vi.mocked(dbModule.getPool).mockReturnValue({
      query: vi.fn().mockRejectedValue(new Error("connection refused")),
    } as never);

    const jsx = await OrgTree();
    render(jsx);

    expect(screen.getByText(/Query error/i)).toBeTruthy();
    expect(screen.getByText(/connection refused/i)).toBeTruthy();
  });
});
