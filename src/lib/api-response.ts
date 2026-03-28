export type PaginationMeta = {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
};

export type ApiResponse<T> =
  | { success: true; data: T; trace_id?: string; pagination?: PaginationMeta }
  | {
      success: false;
      error: { code: string; message: string; details?: Record<string, unknown> };
      trace_id?: string;
    };

export function ok<T>(
  data: T,
  opts?: { traceId?: string; pagination?: PaginationMeta },
): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(opts?.traceId !== undefined && { trace_id: opts.traceId }),
    ...(opts?.pagination !== undefined && { pagination: opts.pagination }),
  };
}

export function apiError(
  code: string,
  message: string,
  opts?: { traceId?: string; details?: Record<string, unknown> },
): ApiResponse<never> {
  return {
    success: false,
    error: {
      code,
      message,
      ...(opts?.details !== undefined && { details: opts.details }),
    },
    ...(opts?.traceId !== undefined && { trace_id: opts.traceId }),
  };
}
