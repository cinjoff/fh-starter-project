import { describe, expect, it } from "vitest";
import { z } from "zod";

// Standalone schema matching BETTER_AUTH_SECRET in env.ts
const betterAuthSecretSchema = z.string().min(32).optional();

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
