import { beforeEach, describe, expect, it, vi } from "vitest";

// --- Mocks (must come before imports of the module under test) ---

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
      updateUser: vi.fn(),
      changePassword: vi.fn(),
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(() => new Headers()),
}));

vi.mock("@sentry/nextjs", () => ({
  withServerActionInstrumentation: vi.fn((_name: string, _opts: unknown, fn: () => unknown) =>
    fn(),
  ),
}));

// Import AFTER mocks
import { APIError } from "better-auth";
import { changePassword, updateProfile } from "@/app/(app)/settings/actions";
import * as authModule from "@/lib/auth";

const fakeSession = {
  user: { id: "user-1", email: "test@example.com", name: "Test User" },
  session: { id: "session-1" },
};

// ---------------------------------------------------------------------------
// updateProfile
// ---------------------------------------------------------------------------

describe("updateProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore a working auth with a valid session by default
    vi.spyOn(authModule, "auth", "get").mockReturnValue({
      api: {
        getSession: vi.fn().mockResolvedValue(fakeSession),
        updateUser: vi.fn().mockResolvedValue({}),
        changePassword: vi.fn().mockResolvedValue({}),
      },
    } as never);
  });

  it("returns success ActionState with valid data", async () => {
    const fd = new FormData();
    fd.append("name", "Alice");

    const result = await updateProfile({ status: "idle" }, fd);

    expect(result).toEqual({ status: "success", message: "Profile updated successfully" });
  });

  it("returns error ActionState when there is no session", async () => {
    vi.spyOn(authModule, "auth", "get").mockReturnValue({
      api: {
        getSession: vi.fn().mockResolvedValue(null),
        updateUser: vi.fn(),
        changePassword: vi.fn(),
      },
    } as never);

    const fd = new FormData();
    fd.append("name", "Alice");

    const result = await updateProfile({ status: "idle" }, fd);

    expect(result).toEqual({ status: "error", message: "Not authenticated" });
  });

  it("returns error ActionState when auth is null", async () => {
    vi.spyOn(authModule, "auth", "get").mockReturnValue(null as never);

    const fd = new FormData();
    fd.append("name", "Alice");

    const result = await updateProfile({ status: "idle" }, fd);

    expect(result).toEqual({ status: "error", message: "Authentication is not configured" });
  });

  it("returns validation error when name is missing", async () => {
    const fd = new FormData();
    // no name field

    const result = await updateProfile({ status: "idle" }, fd);

    expect(result.status).toBe("error");
    expect((result as { status: "error"; message: string }).message).toBe("Validation failed");
  });

  it("returns validation error when name exceeds 100 characters", async () => {
    const fd = new FormData();
    fd.append("name", "a".repeat(101));

    const result = await updateProfile({ status: "idle" }, fd);

    expect(result.status).toBe("error");
    expect((result as { status: "error"; message: string }).message).toBe("Validation failed");
  });
});

// ---------------------------------------------------------------------------
// changePassword
// ---------------------------------------------------------------------------

describe("changePassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore a working auth with a valid session by default
    vi.spyOn(authModule, "auth", "get").mockReturnValue({
      api: {
        getSession: vi.fn().mockResolvedValue(fakeSession),
        updateUser: vi.fn().mockResolvedValue({}),
        changePassword: vi.fn().mockResolvedValue({}),
      },
    } as never);
  });

  function validPasswordForm(overrides?: Partial<Record<string, string>>) {
    const fd = new FormData();
    fd.append("currentPassword", overrides?.currentPassword ?? "OldPass123");
    fd.append("newPassword", overrides?.newPassword ?? "NewPass456");
    fd.append("confirmPassword", overrides?.confirmPassword ?? "NewPass456");
    return fd;
  }

  it("returns success ActionState with valid data", async () => {
    const result = await changePassword({ status: "idle" }, validPasswordForm());

    expect(result).toEqual({ status: "success", message: "Password changed successfully" });
  });

  it("returns error when current password is wrong (INVALID_PASSWORD)", async () => {
    vi.spyOn(authModule, "auth", "get").mockReturnValue({
      api: {
        getSession: vi.fn().mockResolvedValue(fakeSession),
        updateUser: vi.fn(),
        changePassword: vi
          .fn()
          .mockRejectedValue(
            new APIError(400, { code: "INVALID_PASSWORD", message: "Invalid password" }),
          ),
      },
    } as never);

    const result = await changePassword({ status: "idle" }, validPasswordForm());

    expect(result).toEqual({ status: "error", message: "Current password is incorrect" });
  });

  it("returns appropriate error when CREDENTIAL_ACCOUNT_NOT_FOUND is thrown", async () => {
    vi.spyOn(authModule, "auth", "get").mockReturnValue({
      api: {
        getSession: vi.fn().mockResolvedValue(fakeSession),
        updateUser: vi.fn(),
        changePassword: vi.fn().mockRejectedValue(
          new APIError(400, {
            code: "CREDENTIAL_ACCOUNT_NOT_FOUND",
            message: "No credential account",
          }),
        ),
      },
    } as never);

    const result = await changePassword({ status: "idle" }, validPasswordForm());

    expect(result).toEqual({
      status: "error",
      message: "Password change not available for social login accounts",
    });
  });

  it("returns error ActionState when auth is null", async () => {
    vi.spyOn(authModule, "auth", "get").mockReturnValue(null as never);

    const result = await changePassword({ status: "idle" }, validPasswordForm());

    expect(result).toEqual({ status: "error", message: "Authentication is not configured" });
  });

  it("returns error ActionState when there is no session", async () => {
    vi.spyOn(authModule, "auth", "get").mockReturnValue({
      api: {
        getSession: vi.fn().mockResolvedValue(null),
        updateUser: vi.fn(),
        changePassword: vi.fn(),
      },
    } as never);

    const result = await changePassword({ status: "idle" }, validPasswordForm());

    expect(result).toEqual({ status: "error", message: "Not authenticated" });
  });

  it("returns validation error when FormData is empty", async () => {
    const fd = new FormData();

    const result = await changePassword({ status: "idle" }, fd);

    expect(result.status).toBe("error");
    expect((result as { status: "error"; message: string }).message).toBe("Validation failed");
  });

  it("returns validation error when passwords do not match", async () => {
    const fd = validPasswordForm({ confirmPassword: "DifferentPass789" });

    const result = await changePassword({ status: "idle" }, fd);

    expect(result.status).toBe("error");
    expect((result as { status: "error"; message: string }).message).toBe("Validation failed");
    const fieldErrors = (result as { status: "error"; fieldErrors?: Record<string, string[]> })
      .fieldErrors;
    expect(fieldErrors?.confirmPassword).toContain("Passwords do not match");
  });
});
