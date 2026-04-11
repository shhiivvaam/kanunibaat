import { Resend } from 'resend';

import { assertOtpRateLimit, OtpRateLimitError } from '@/lib/otp-rate-limit';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_WINDOW = 8;

export async function sendEmailVerificationOtp(payload: {
  email: string;
  otp: string;
  type: 'sign-in' | 'email-verification' | 'forget-password' | 'change-email';
}): Promise<void> {
  try {
    assertOtpRateLimit(`email-otp:${payload.email}`, { max: MAX_PER_WINDOW, windowMs: WINDOW_MS });
  } catch (e) {
    if (e instanceof OtpRateLimitError) throw e;
    throw e;
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.FROM_EMAIL?.trim();
  if (!apiKey || !from) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RESEND_API_KEY and FROM_EMAIL are required for email OTP in production.');
    }
    return;
  }

  const resend = new Resend(apiKey);
  const subject =
    payload.type === 'sign-in'
      ? 'Your KanuniBaat sign-in code'
      : 'Your KanuniBaat verification code';

  const { error } = await resend.emails.send({
    from,
    to: payload.email,
    subject,
    html: `<p>Your verification code is <strong>${payload.otp}</strong></p><p>This code expires in a few minutes.</p>`,
  });

  if (error) {
    throw new Error(error.message);
  }
}
