type RateLimitOptions = {
  namespace: string;
  identifier: string;
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  source: "memory";
};

const memoryStore = new Map<string, { count: number; resetAt: number }>();

function memoryFallback(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = memoryStore.get(key);

  if (!existing || now > existing.resetAt) {
    const resetAt = now + windowMs;
    memoryStore.set(key, { count: 1, resetAt });
    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - 1),
      reset: resetAt,
      source: "memory",
    };
  }

  if (existing.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: existing.resetAt,
      source: "memory",
    };
  }

  existing.count += 1;
  return {
    success: true,
    limit,
    remaining: Math.max(0, limit - existing.count),
    reset: existing.resetAt,
    source: "memory",
  };
}

export async function enforceRateLimit({
  namespace,
  identifier,
  limit,
  windowMs,
}: RateLimitOptions): Promise<RateLimitResult> {
  const normalizedKey = `${namespace}:${identifier}`;
  return memoryFallback(normalizedKey, limit, windowMs);
}
