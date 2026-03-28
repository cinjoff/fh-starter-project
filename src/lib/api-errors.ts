export class ApiError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;

  constructor(message: string, status: number, code: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

export class ValidationError extends ApiError {
  constructor(message = "Validation failed", fieldErrors: Record<string, string[]>) {
    super(message, 422, "VALIDATION_ERROR", { fieldErrors });
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Conflict") {
    super(message, 409, "CONFLICT");
  }
}

export class ServiceUnavailableError extends ApiError {
  constructor(message = "Service unavailable") {
    super(message, 503, "SERVICE_UNAVAILABLE");
  }
}

export class BadGatewayError extends ApiError {
  constructor(message = "Bad gateway") {
    super(message, 502, "BAD_GATEWAY");
  }
}

export class TooManyRequestsError extends ApiError {
  constructor(message = "Too many requests") {
    super(message, 429, "RATE_LIMITED");
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}
