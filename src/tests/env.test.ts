import { describe, expect, it } from "vitest";
import { z } from "zod";

// Standalone schema matching the ENABLE_ORGANIZATIONS transform in env.ts
const enableOrganizationsSchema = z
  .string()
  .optional()
  .transform((v) => v === "true" || v === "1");

// Standalone schema matching BETTER_AUTH_SECRET in env.ts
const betterAuthSecretSchema = z.string().min(32).optional();

describe("ENABLE_ORGANIZATIONS Zod transform", () => {
  it('transforms "true" to true', () => {
    const result = enableOrganizationsSchema.parse("true");
    expect(result).toBe(true);
  });

  it('transforms "1" to true', () => {
    const result = enableOrganizationsSchema.parse("1");
    expect(result).toBe(true);
  });

  it("transforms undefined to false (optional field not provided)", () => {
    const result = enableOrganizationsSchema.parse(undefined);
    // The transform runs on undefined too: undefined === "true" || undefined === "1" → false
    expect(result).toBe(false);
  });

  it('transforms "false" to false without throwing', () => {
    const result = enableOrganizationsSchema.parse("false");
    expect(result).toBe(false);
  });

  it('transforms "0" to false without throwing', () => {
    const result = enableOrganizationsSchema.parse("0");
    expect(result).toBe(false);
  });

  it("transforms empty string to false without throwing", () => {
    const result = enableOrganizationsSchema.parse("");
    expect(result).toBe(false);
  });
});

describe("BETTER_AUTH_SECRET min length validation", () => {
  it("accepts a string of 32+ characters", () => {
    const secret = "a".repeat(32);
    expect(betterAuthSecretSchema.parse(secret)).toBe(secret);
  });

  it("rejects a string shorter than 32 characters", () => {
    expect(() => betterAuthSecretSchema.parse("short")).toThrow();
  });

  it("rejects an empty string", () => {
    expect(() => betterAuthSecretSchema.parse("")).toThrow();
  });

  it("accepts undefined (auth is optional)", () => {
    expect(betterAuthSecretSchema.parse(undefined)).toBeUndefined();
  });
});
