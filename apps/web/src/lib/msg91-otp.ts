import { assertOtpRateLimit } from '@/lib/otp-rate-limit';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_WINDOW = 5;

/**
 * Sends an OTP via MSG91 using Flow API. Template variables depend on the panel setup;
 * common patterns use `var` or `OTP` — adjust in the MSG91 dashboard to match.
 */
export async function sendMsg91Otp(phoneNumber: string, otp: string): Promise<void> {
  assertOtpRateLimit(`msg91:${phoneNumber}`, { max: MAX_PER_WINDOW, windowMs: WINDOW_MS });

  const authkey = process.env.MSG91_API_KEY?.trim();
  const templateId = process.env.MSG91_TEMPLATE_ID_OTP?.trim();
  if (!authkey || !templateId) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MSG91_API_KEY and MSG91_TEMPLATE_ID_OTP are required in production.');
    }
    return;
  }

  const normalized = phoneNumber.replace(/\s/g, '').replace(/^\+/, '');

  const res = await fetch('https://control.msg91.com/api/v5/flow/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authkey,
    },
    body: JSON.stringify({
      template_id: templateId,
      short_url: '0',
      recipients: [{ mobiles: normalized, var: otp, OTP: otp }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`MSG91 request failed (${res.status}): ${body.slice(0, 500)}`);
  }
}
