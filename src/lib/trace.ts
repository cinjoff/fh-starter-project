import { AsyncLocalStorage } from "node:async_hooks";

type TraceContext = { traceId: string; startTime: number };

const traceStorage = new AsyncLocalStorage<TraceContext>();

/**
 * Wraps fn in a trace context. Accepts an optional existingTraceId; if omitted, a fresh UUID is generated.
 * All code within fn (including downstream async calls) can call getTraceId() and getTraceElapsed().
 */
export function withTrace<T>(fn: () => Promise<T>, existingTraceId?: string): Promise<T> {
  const traceId = existingTraceId ?? crypto.randomUUID();
  const startTime = Date.now();
  return traceStorage.run({ traceId, startTime }, fn);
}

/**
 * Returns the current trace ID, or "no-trace" if called outside a withTrace context.
 */
export function getTraceId(): string {
  return traceStorage.getStore()?.traceId ?? "no-trace";
}

/**
 * Returns elapsed milliseconds since the current withTrace context started, or 0 if outside context.
 */
export function getTraceElapsed(): number {
  const store = traceStorage.getStore();
  if (!store) return 0;
  return Date.now() - store.startTime;
}
