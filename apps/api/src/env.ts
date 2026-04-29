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
  MEILISEARCH_URL: z.string().optional(),
  MEILISEARCH_MASTER_KEY: z.string().optional(),
  MEILISEARCH_INDEX_LAWYERS: z.string().optional(),
  MEILISEARCH_INDEX_JUDGMENTS: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  GOOGLE_CLOUD_VISION_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  INTERNAL_CRON_SECRET: z.string().optional(),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),
  LIVEKIT_URL: z.string().optional(),
  LIVEKIT_API_KEY: z.string().optional(),
  LIVEKIT_API_SECRET: z.string().optional(),
  WHATSAPP_API_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().optional(),
  WHATSAPP_APP_SECRET: z.string().optional(),
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
