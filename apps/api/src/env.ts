import type { WaitlistEnv } from '@kb/waitlist';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(4000),
  CORS_ORIGIN: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
  RESEND_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().optional(),
  WAITLIST_NOTIFY_EMAIL: z.string().optional(),
});

export type ApiEnv = z.infer<typeof envSchema>;

export function loadApiEnv(): ApiEnv {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;
    throw new Error(`Invalid API environment: ${JSON.stringify(msg)}`);
  }
  return parsed.data;
}

export function buildWaitlistEnv(env: ApiEnv): WaitlistEnv {
  const from = env.FROM_EMAIL?.trim();
  const notifyOverride = env.WAITLIST_NOTIFY_EMAIL?.trim();
  const notify =
    notifyOverride && notifyOverride.length > 0 ? notifyOverride : from;
  return {
    nodeEnv: env.NODE_ENV,
    resendApiKey: env.RESEND_API_KEY?.trim(),
    fromEmail: from,
    notifyEmail: notify,
  };
}
