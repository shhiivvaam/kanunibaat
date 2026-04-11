import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { bearer } from 'better-auth/plugins/bearer';
import { emailOTP } from 'better-auth/plugins/email-otp';
import { nextCookies } from 'better-auth/next-js';
import { phoneNumber } from 'better-auth/plugins/phone-number';

import { db } from '@kb/database';
import { account, session, user, verification } from '@kb/database/schema';

import { sendEmailVerificationOtp } from '@/lib/email-otp-delivery';
import { sendMsg91Otp } from '@/lib/msg91-otp';

function getAuthSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (secret) return secret;
  if (process.env.VERCEL === '1' || process.env.RAILWAY_ENVIRONMENT === 'production') {
    throw new Error('BETTER_AUTH_SECRET is required in this hosted environment.');
  }
  return 'local-build-placeholder-set-better-auth-secret-in-env';
}

export const auth = betterAuth({
  appName: 'KanuniBaat',
  baseURL:
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3000',
  secret: getAuthSecret(),
  trustedOrigins: [
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
  ].filter((x): x is string => Boolean(x)),
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: { user, session, account, verification },
  }),
  emailAndPassword: { enabled: true },
  plugins: [
    bearer(),
    emailOTP({
      sendVerificationOTP: async ({ email, otp, type }) => {
        await sendEmailVerificationOtp({ email, otp, type });
      },
    }),
    phoneNumber({
      sendOTP: async ({ phoneNumber: phone, code }) => {
        await sendMsg91Otp(phone, code);
      },
      signUpOnVerification: {
        getTempEmail: (phone) => `phone_${phone.replace(/\D/g, '')}@users.kanunibaat.internal`,
        getTempName: () => 'KanuniBaat user',
      },
    }),
    nextCookies(),
  ],
});
