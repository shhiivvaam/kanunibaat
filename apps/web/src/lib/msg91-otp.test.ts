import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('sendMsg91Otp', () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...origEnv };
    vi.restoreAllMocks();
  });

  it('does not call MSG91 when keys are missing outside production', async () => {
    process.env = {
      ...origEnv,
      NODE_ENV: 'development',
      MSG91_API_KEY: '',
      MSG91_TEMPLATE_ID_OTP: '',
      UPSTASH_REDIS_URL: '',
      UPSTASH_REDIS_TOKEN: '',
    };
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { sendMsg91Otp } = await import('./msg91-otp');
    const phone = `+9198765${String(Math.floor(Math.random() * 100_000)).padStart(5, '0')}`;
    await sendMsg91Otp(phone, '123456');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('throws when MSG91 is not configured in production', async () => {
    process.env = {
      ...origEnv,
      NODE_ENV: 'production',
      MSG91_API_KEY: '',
      MSG91_TEMPLATE_ID_OTP: '',
      UPSTASH_REDIS_URL: '',
      UPSTASH_REDIS_TOKEN: '',
    };
    const { sendMsg91Otp } = await import('./msg91-otp');
    await expect(sendMsg91Otp('+919999999999', '123456')).rejects.toThrow(/MSG91_API_KEY/);
  });
});
