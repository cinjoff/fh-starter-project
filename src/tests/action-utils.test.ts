import { describe, expect, it } from "vitest";
import { z } from "zod";
import { actionError, actionSuccess, parseFormData } from "@/lib/action-utils";

const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
});

describe("parseFormData()", () => {
  it("returns success with parsed data for valid input", () => {
    const formData = new FormData();
    formData.append("name", "Alice");
    formData.append("email", "alice@example.com");

    const result = parseFormData(userSchema, formData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: "Alice", email: "alice@example.com" });
    }
  });

  it("returns error with fieldErrors grouped by field for invalid input", () => {
    const formData = new FormData();
    formData.append("name", "");
    formData.append("email", "not-an-email");

    const result = parseFormData(userSchema, formData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.state.status).toBe("error");
      if (result.state.status === "error") {
        expect(result.state.message).toBe("Validation failed");
        expect(result.state.fieldErrors).toBeDefined();
        expect(result.state.fieldErrors?.name).toContain("Name is required");
        expect(result.state.fieldErrors?.email).toContain("Invalid email");
      }
    }
  });

  it("groups multiple errors for same field", () => {
    const schema = z.object({
      password: z.string().min(8, "Too short").regex(/[A-Z]/, "Need uppercase"),
    });

    const formData = new FormData();
    formData.append("password", "abc");

    const result = parseFormData(schema, formData);
    expect(result.success).toBe(false);
    if (!result.success && result.state.status === "error") {
      const passwordErrors = result.state.fieldErrors?.password;
      expect(passwordErrors).toBeDefined();
      expect(passwordErrors?.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("returns error state when required fields are missing", () => {
    const formData = new FormData();
    // no fields appended

    const result = parseFormData(userSchema, formData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.state.status).toBe("error");
    }
  });
});

describe("actionSuccess()", () => {
  it("returns status: success with the provided message", () => {
    const state = actionSuccess("Saved successfully");
    expect(state.status).toBe("success");
    if (state.status === "success") {
      expect(state.message).toBe("Saved successfully");
    }
  });
});

describe("actionError()", () => {
  it("returns status: error with the provided message", () => {
    const state = actionError("Something went wrong");
    expect(state.status).toBe("error");
    if (state.status === "error") {
      expect(state.message).toBe("Something went wrong");
    }
  });

  it("includes fieldErrors when provided", () => {
    const fieldErrors = { email: ["Invalid email"] };
    const state = actionError("Validation failed", fieldErrors);
    expect(state.status).toBe("error");
    if (state.status === "error") {
      expect(state.fieldErrors).toEqual(fieldErrors);
    }
  });

  it("does not include fieldErrors when not provided", () => {
    const state = actionError("Error");
    if (state.status === "error") {
      expect(state.fieldErrors).toBeUndefined();
    }
  });
});
