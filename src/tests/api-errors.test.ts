import { describe, expect, it } from "vitest";
import {
  ApiError,
  BadGatewayError,
  ConflictError,
  ForbiddenError,
  isApiError,
  NotFoundError,
  ServiceUnavailableError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/api-errors";

describe("ApiError base class", () => {
  it("stores status, code, and message", () => {
    const err = new ApiError("something went wrong", 500, "INTERNAL_ERROR");
    expect(err.message).toBe("something went wrong");
    expect(err.status).toBe(500);
    expect(err.code).toBe("INTERNAL_ERROR");
    expect(err.details).toBeUndefined();
  });

  it("stores optional details", () => {
    const err = new ApiError("oops", 500, "INTERNAL_ERROR", { foo: "bar" });
    expect(err.details).toEqual({ foo: "bar" });
  });

  it("is an instance of Error", () => {
    const err = new ApiError("oops", 500, "INTERNAL_ERROR");
    expect(err).toBeInstanceOf(Error);
  });
});

describe("UnauthorizedError", () => {
  it("has status 401 and code UNAUTHORIZED", () => {
    const err = new UnauthorizedError();
    expect(err.status).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
  });

  it("has default message 'Unauthorized'", () => {
    const err = new UnauthorizedError();
    expect(err.message).toBe("Unauthorized");
  });

  it("accepts custom message", () => {
    const err = new UnauthorizedError("Token expired");
    expect(err.message).toBe("Token expired");
  });
});

describe("ForbiddenError", () => {
  it("has status 403 and code FORBIDDEN", () => {
    const err = new ForbiddenError();
    expect(err.status).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
  });

  it("has default message 'Forbidden'", () => {
    const err = new ForbiddenError();
    expect(err.message).toBe("Forbidden");
  });

  it("accepts custom message", () => {
    const err = new ForbiddenError("Access denied");
    expect(err.message).toBe("Access denied");
  });
});

describe("ValidationError", () => {
  it("has status 422 and code VALIDATION_ERROR", () => {
    const err = new ValidationError("Bad input", { email: ["Invalid email"] });
    expect(err.status).toBe(422);
    expect(err.code).toBe("VALIDATION_ERROR");
  });

  it("has default message 'Validation failed'", () => {
    const err = new ValidationError(undefined, { name: ["Required"] });
    expect(err.message).toBe("Validation failed");
  });

  it("stores fieldErrors in details", () => {
    const fieldErrors = { email: ["Invalid email"], name: ["Too short"] };
    const err = new ValidationError("Bad input", fieldErrors);
    expect(err.details).toEqual({ fieldErrors });
  });

  it("accepts custom message", () => {
    const err = new ValidationError("Custom validation error", {
      field: ["Error"],
    });
    expect(err.message).toBe("Custom validation error");
  });
});

describe("NotFoundError", () => {
  it("has status 404 and code NOT_FOUND", () => {
    const err = new NotFoundError();
    expect(err.status).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
  });

  it("has default message 'Not found'", () => {
    const err = new NotFoundError();
    expect(err.message).toBe("Not found");
  });

  it("accepts custom message", () => {
    const err = new NotFoundError("User not found");
    expect(err.message).toBe("User not found");
  });
});

describe("ConflictError", () => {
  it("has status 409 and code CONFLICT", () => {
    const err = new ConflictError();
    expect(err.status).toBe(409);
    expect(err.code).toBe("CONFLICT");
  });

  it("has default message 'Conflict'", () => {
    const err = new ConflictError();
    expect(err.message).toBe("Conflict");
  });

  it("accepts custom message", () => {
    const err = new ConflictError("Email already in use");
    expect(err.message).toBe("Email already in use");
  });
});

describe("ServiceUnavailableError", () => {
  it("has status 503 and code SERVICE_UNAVAILABLE", () => {
    const err = new ServiceUnavailableError();
    expect(err.status).toBe(503);
    expect(err.code).toBe("SERVICE_UNAVAILABLE");
  });

  it("has default message 'Service unavailable'", () => {
    const err = new ServiceUnavailableError();
    expect(err.message).toBe("Service unavailable");
  });

  it("accepts custom message", () => {
    const err = new ServiceUnavailableError("Database down");
    expect(err.message).toBe("Database down");
  });
});

describe("BadGatewayError", () => {
  it("has status 502 and code BAD_GATEWAY", () => {
    const err = new BadGatewayError();
    expect(err.status).toBe(502);
    expect(err.code).toBe("BAD_GATEWAY");
  });

  it("has default message 'Bad gateway'", () => {
    const err = new BadGatewayError();
    expect(err.message).toBe("Bad gateway");
  });

  it("accepts custom message", () => {
    const err = new BadGatewayError("Upstream error");
    expect(err.message).toBe("Upstream error");
  });
});

describe("isApiError", () => {
  it("returns true for ApiError instances", () => {
    expect(isApiError(new ApiError("oops", 500, "INTERNAL_ERROR"))).toBe(true);
  });

  it("returns true for subclass instances", () => {
    expect(isApiError(new UnauthorizedError())).toBe(true);
    expect(isApiError(new NotFoundError())).toBe(true);
  });

  it("returns false for plain Error", () => {
    expect(isApiError(new Error("plain"))).toBe(false);
  });

  it("returns false for non-error values", () => {
    expect(isApiError("string")).toBe(false);
    expect(isApiError(null)).toBe(false);
    expect(isApiError(undefined)).toBe(false);
    expect(isApiError(42)).toBe(false);
    expect(isApiError({})).toBe(false);
  });
});
