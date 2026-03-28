export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetMs: number;
};

export function createRateLimiter(config: { maxRequests: number; windowMs: number }) {
  const { maxRequests, windowMs } = config;
  const store = new Map<string, number[]>();

  const interval = setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of store) {
      const active = timestamps.filter((t) => now - t < windowMs);
      if (active.length === 0) {
        store.delete(key);
      } else {
        store.set(key, active);
      }
    }
  }, 60_000);

  interval.unref();

  return {
    check(key: string): RateLimitResult {
      const now = Date.now();
      const timestamps = store.get(key) ?? [];
      const active = timestamps.filter((t) => now - t < windowMs);

      if (active.length < maxRequests) {
        active.push(now);
        store.set(key, active);
        return {
          allowed: true,
          remaining: maxRequests - active.length,
          resetMs: 0,
        };
      }

      // Blocked — resetMs is time until the oldest timestamp leaves the window
      const oldest = active[0];
      const resetMs = oldest + windowMs - now;

      return {
        allowed: false,
        remaining: 0,
        resetMs: Math.max(0, resetMs),
      };
    },
  };
}
