import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});

redis.on("connect", () => {
  console.log("Connected to Redis");
});

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStart = now - windowMs;

  const redisKey = `ratelimit:${key}`;

  // Use a sliding window with sorted set
  const pipeline = redis.pipeline();

  // Remove old entries outside the window
  pipeline.zremrangebyscore(redisKey, 0, windowStart);

  // Count current entries in window
  pipeline.zcard(redisKey);

  // Add current request
  pipeline.zadd(redisKey, now, `${now}-${Math.random()}`);

  // Set expiry on the key
  pipeline.expire(redisKey, windowSeconds + 1);

  const results = await pipeline.exec();

  if (!results) {
    // Redis error, allow request but log
    console.error("Redis pipeline returned null");
    return { allowed: true, remaining: limit, resetAt: now + windowMs };
  }

  const currentCount = (results[1]?.[1] as number) || 0;
  const allowed = currentCount < limit;
  const remaining = Math.max(0, limit - currentCount - 1);
  const resetAt = now + windowMs;

  if (!allowed) {
    // Remove the request we just added since it's not allowed
    await redis.zrem(redisKey, `${now}-${Math.random()}`);
  }

  return { allowed, remaining, resetAt };
}

export async function getRateLimitInfo(
  key: string,
  limit: number,
  windowSeconds: number = 60
): Promise<{ used: number; remaining: number; resetAt: number }> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const windowStart = now - windowMs;
  const redisKey = `ratelimit:${key}`;

  // Clean old entries and count
  await redis.zremrangebyscore(redisKey, 0, windowStart);
  const used = await redis.zcard(redisKey);

  return {
    used,
    remaining: Math.max(0, limit - used),
    resetAt: now + windowMs,
  };
}
