import { describe, expect, it } from "vitest";
import { ForbiddenError } from "@/lib/api-errors";
import { buildMemberContext, hasRole, requireRole } from "@/lib/roles";

describe("buildMemberContext", () => {
  it("sets all flags true for owner", () => {
    const ctx = buildMemberContext({ role: "owner", userId: "u1", organizationId: "o1" });
    expect(ctx.role).toBe("owner");
    expect(ctx.isOwner).toBe(true);
    expect(ctx.isAdmin).toBe(true);
    expect(ctx.isMember).toBe(true);
  });

  it("sets isOwner false for admin", () => {
    const ctx = buildMemberContext({ role: "admin", userId: "u2", organizationId: "o1" });
    expect(ctx.role).toBe("admin");
    expect(ctx.isOwner).toBe(false);
    expect(ctx.isAdmin).toBe(true);
    expect(ctx.isMember).toBe(true);
  });

  it("sets only isMember true for member", () => {
    const ctx = buildMemberContext({ role: "member", userId: "u3", organizationId: "o1" });
    expect(ctx.role).toBe("member");
    expect(ctx.isOwner).toBe(false);
    expect(ctx.isAdmin).toBe(false);
    expect(ctx.isMember).toBe(true);
  });

  it("throws ForbiddenError for invalid role string", () => {
    expect(() =>
      buildMemberContext({ role: "superadmin", userId: "u4", organizationId: "o1" }),
    ).toThrow(ForbiddenError);
  });

  it("passes through userId and organizationId", () => {
    const ctx = buildMemberContext({ role: "member", userId: "abc", organizationId: "xyz" });
    expect(ctx.userId).toBe("abc");
    expect(ctx.organizationId).toBe("xyz");
  });
});

describe("requireRole", () => {
  const owner = buildMemberContext({ role: "owner", userId: "u1", organizationId: "o1" });
  const admin = buildMemberContext({ role: "admin", userId: "u2", organizationId: "o1" });
  const member = buildMemberContext({ role: "member", userId: "u3", organizationId: "o1" });

  describe("minRole: admin", () => {
    it("passes for owner", () => {
      expect(() => requireRole(owner, "admin")).not.toThrow();
    });

    it("passes for admin", () => {
      expect(() => requireRole(admin, "admin")).not.toThrow();
    });

    it("throws ForbiddenError for member", () => {
      expect(() => requireRole(member, "admin")).toThrow(ForbiddenError);
    });
  });

  describe("minRole: owner", () => {
    it("passes for owner", () => {
      expect(() => requireRole(owner, "owner")).not.toThrow();
    });

    it("throws ForbiddenError for admin", () => {
      expect(() => requireRole(admin, "owner")).toThrow(ForbiddenError);
    });

    it("throws ForbiddenError for member", () => {
      expect(() => requireRole(member, "owner")).toThrow(ForbiddenError);
    });
  });

  describe("minRole: member", () => {
    it("passes for all roles", () => {
      expect(() => requireRole(owner, "member")).not.toThrow();
      expect(() => requireRole(admin, "member")).not.toThrow();
      expect(() => requireRole(member, "member")).not.toThrow();
    });
  });
});

describe("hasRole", () => {
  const owner = buildMemberContext({ role: "owner", userId: "u1", organizationId: "o1" });
  const admin = buildMemberContext({ role: "admin", userId: "u2", organizationId: "o1" });
  const member = buildMemberContext({ role: "member", userId: "u3", organizationId: "o1" });

  it("returns true when role meets minimum", () => {
    expect(hasRole(owner, "admin")).toBe(true);
    expect(hasRole(admin, "admin")).toBe(true);
    expect(hasRole(member, "member")).toBe(true);
  });

  it("returns false when role is below minimum", () => {
    expect(hasRole(member, "admin")).toBe(false);
    expect(hasRole(admin, "owner")).toBe(false);
    expect(hasRole(member, "owner")).toBe(false);
  });

  it("never throws", () => {
    expect(() => hasRole(member, "owner")).not.toThrow();
  });
});
