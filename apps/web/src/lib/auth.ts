import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';

import { db } from '@kb/database';
import { account, session, user, verification } from '@kb/database/schema';

function getAuthSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (secret) return secret;
  // Hosted deploys must set a real secret. Local/CI builds may omit it; Next still runs with NODE_ENV=production.
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
  plugins: [nextCookies()],
});
