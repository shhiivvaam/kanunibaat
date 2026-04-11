/**
 * Best-effort in-process throttling for OTP delivery callbacks (MSG91 / custom paths).
 * Better Auth's email-otp plugin applies its own rate limits on HTTP routes; this layer
 * adds defense-in-depth for SMS cost abuse when keys are configured.
 */
const buckets = new Map<string, number[]>();

export class OtpRateLimitError extends Error {
  constructor(message = 'Too many requests. Try again later.') {
    super(message);
    this.name = 'OtpRateLimitError';
  }
}

export function assertOtpRateLimit(
  key: string,
  opts: { max: number; windowMs: number },
): void {
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
