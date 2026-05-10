import { describe, expect, it } from 'vitest';

describe('assertOtpRateLimit (in-memory fallback)', () => {
  it('allows up to max events per window then throws', async () => {
    const { assertOtpRateLimit, OtpRateLimitError } = await import('./otp-rate-limit');
    const key = `vitest-otp-${Math.random().toString(36).slice(2)}`;
    const opts = { max: 3, windowMs: 60_000 };
    await assertOtpRateLimit(key, opts);
    await assertOtpRateLimit(key, opts);
    await assertOtpRateLimit(key, opts);
    await expect(assertOtpRateLimit(key, opts)).rejects.toThrow(OtpRateLimitError);
  });
});
