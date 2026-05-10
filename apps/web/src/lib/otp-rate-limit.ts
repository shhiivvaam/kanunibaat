/**
 * Redis-backed rate limiting for OTP delivery (email/SMS).
 * Falls back to in-memory throttling if Redis is not configured.
 * Better Auth's email-otp plugin applies its own rate limits on HTTP routes; this layer
 * adds defense-in-depth for SMS cost abuse and works across multiple instances.
 */
import { Redis } from '@upstash/redis';

const buckets = new Map<string, number[]>();
let redis: Redis | null = null;

try {
  const url = process.env.UPSTASH_REDIS_URL?.trim();
  const token = process.env.UPSTASH_REDIS_TOKEN?.trim();
  if (url && token) {
    redis = new Redis({ url, token });
  }
} catch (e) {
  console.warn('Failed to initialize Redis for OTP rate limiting, falling back to in-memory:', e);
}

export class OtpRateLimitError extends Error {
  constructor(message = 'Too many requests. Try again later.') {
    super(message);
    this.name = 'OtpRateLimitError';
  }
}

async function checkRedisRateLimit(
  key: string,
  opts: { max: number; windowMs: number },
): Promise<void> {
  if (!redis) {
    throw new Error('Redis not configured');
  }

  const now = Date.now();
  const windowStart = now - opts.windowMs;
  const redisKey = `otp-rate-limit:${key}`;

  await redis.zremrangebyscore(redisKey, 0, windowStart);
  const count = await redis.zcard(redisKey);

  if (count >= opts.max) {
    throw new OtpRateLimitError();
  }

  await redis.zadd(redisKey, { score: now, member: `${now}` });
  await redis.expire(redisKey, Math.ceil(opts.windowMs / 1000));
}

function checkInMemoryRateLimit(key: string, opts: { max: number; windowMs: number }): void {
  const now = Date.now();
  const windowStart = now - opts.windowMs;
  const prev = buckets.get(key) ?? [];
  const next = prev.filter((t) => t > windowStart);
  if (next.length >= opts.max) {
    throw new OtpRateLimitError();
  }
  next.push(now);
  buckets.set(key, next);
}

export async function assertOtpRateLimit(
  key: string,
  opts: { max: number; windowMs: number },
): Promise<void> {
  if (redis) {
    await checkRedisRateLimit(key, opts);
  } else {
    checkInMemoryRateLimit(key, opts);
  }
}
