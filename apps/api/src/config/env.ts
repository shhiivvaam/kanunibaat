import type { WaitlistEnv } from '@jurisly/waitlist';
import { z } from 'zod';

const envObject = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(4000),
  CORS_ORIGIN: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().optional(),
  BETTER_AUTH_URL: z.string().optional(),
  BETTER_AUTH_SESSION_COOKIE_NAMES: z.string().optional(),
  /** Used by WhatsApp bot deep links when BETTER_AUTH_URL is unset. */
  NEXT_PUBLIC_APP_URL: z.string().optional(),
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
  NJDG_BRIDGE_URL: z.string().optional(),
  NJDG_BRIDGE_SECRET: z.string().optional(),
  UPSTASH_REDIS_URL: z.string().optional(),
  UPSTASH_REDIS_TOKEN: z.string().optional(),
  /** Only `stub` exists today — confirms prod acknowledges vault bytes are not AV-scanned. Required in production. */
  VAULT_MALWARE_SCAN_PROVIDER: z.string().optional(),
});

const envSchema = envObject.superRefine((data, ctx) => {
  if (data.NODE_ENV !== 'production') return;

  const need = (path: keyof z.infer<typeof envObject>, label: string) => {
    const raw = data[path];
    if (typeof raw !== 'string' || raw.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${label} is required in production`,
        path: [path],
      });
    }
  };

  need('DATABASE_URL', 'DATABASE_URL');
  need('BETTER_AUTH_SECRET', 'BETTER_AUTH_SECRET');
  need('BETTER_AUTH_URL', 'BETTER_AUTH_URL');

  const vaultMp = data.VAULT_MALWARE_SCAN_PROVIDER?.trim().toLowerCase();
  if (vaultMp !== 'stub') {
    if (!vaultMp) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'VAULT_MALWARE_SCAN_PROVIDER must be stub in production until antivirus integration ships',
        path: ['VAULT_MALWARE_SCAN_PROVIDER'],
      });
    } else {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `VAULT_MALWARE_SCAN_PROVIDER must be stub in production (only stub is implemented today; received "${data.VAULT_MALWARE_SCAN_PROVIDER?.trim()}")`,
        path: ['VAULT_MALWARE_SCAN_PROVIDER'],
      });
    }
  }

  const meiliUrl = data.MEILISEARCH_URL?.trim();
  const meiliKey = data.MEILISEARCH_MASTER_KEY?.trim();
  if (meiliUrl && !meiliKey) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        'MEILISEARCH_MASTER_KEY is required in production when MEILISEARCH_URL is set',
      path: ['MEILISEARCH_MASTER_KEY'],
    });
  }

  const s3 = [
    data.AWS_ACCESS_KEY_ID?.trim(),
    data.AWS_SECRET_ACCESS_KEY?.trim(),
    data.AWS_REGION?.trim(),
    data.AWS_S3_BUCKET?.trim(),
  ];
  const s3Count = s3.filter((s) => s && s.length > 0).length;
  if (s3Count > 0 && s3Count < 4) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        'In production, enable S3 by setting all of AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET',
      path: ['AWS_S3_BUCKET'],
    });
  }

  const lk = [
    data.LIVEKIT_URL?.trim(),
    data.LIVEKIT_API_KEY?.trim(),
    data.LIVEKIT_API_SECRET?.trim(),
  ];
  const lkCount = lk.filter((s) => s && s.length > 0).length;
  if (lkCount > 0 && lkCount < 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        'In production, enable LiveKit by setting LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET',
      path: ['LIVEKIT_URL'],
    });
  }

  const rpId = data.RAZORPAY_KEY_ID?.trim();
  const rpSecret = data.RAZORPAY_KEY_SECRET?.trim();
  if ((rpId && !rpSecret) || (!rpId && rpSecret)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        'In production, set both RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET when using Razorpay keys',
      path: ['RAZORPAY_KEY_ID'],
    });
  }

  const njdgUrl = data.NJDG_BRIDGE_URL?.trim();
  const njdgSecret = data.NJDG_BRIDGE_SECRET?.trim();
  if ((njdgUrl && !njdgSecret) || (!njdgUrl && njdgSecret)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        'NJDG bridge requires both NJDG_BRIDGE_URL and NJDG_BRIDGE_SECRET when enabled',
      path: ['NJDG_BRIDGE_URL'],
    });
  }

  const waT = data.WHATSAPP_API_TOKEN?.trim();
  const waP = data.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const waV = data.WHATSAPP_VERIFY_TOKEN?.trim();
  const waAny = Boolean(waT || waP || waV);
  if (waAny && !(waT && waP && waV)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        'WhatsApp webhooks require WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID, and WHATSAPP_VERIFY_TOKEN together',
      path: ['WHATSAPP_API_TOKEN'],
    });
  }
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

/**
 * Copies validated API env into `process.env` for packages that still read env at runtime
 * (e.g. Better Auth session unsigning in `@jurisly/trpc`).
 */
export function applyApiEnvToProcessEnv(api: ApiEnv): void {
  const set = (key: string, value: string | undefined | null) => {
    if (value != null && value !== '') {
      process.env[key] = value;
    }
  };

  set('NODE_ENV', api.NODE_ENV);
  process.env.PORT = String(api.PORT);
  set('DATABASE_URL', api.DATABASE_URL);
  set('CORS_ORIGIN', api.CORS_ORIGIN);
  set('BETTER_AUTH_SECRET', api.BETTER_AUTH_SECRET);
  set('BETTER_AUTH_URL', api.BETTER_AUTH_URL);
  set('BETTER_AUTH_SESSION_COOKIE_NAMES', api.BETTER_AUTH_SESSION_COOKIE_NAMES);
  set('NEXT_PUBLIC_APP_URL', api.NEXT_PUBLIC_APP_URL);
  set('SENTRY_DSN', api.SENTRY_DSN);
  set('SENTRY_ENVIRONMENT', api.SENTRY_ENVIRONMENT);
  process.env.SENTRY_TRACES_SAMPLE_RATE = String(api.SENTRY_TRACES_SAMPLE_RATE);
  set('RESEND_API_KEY', api.RESEND_API_KEY);
  set('FROM_EMAIL', api.FROM_EMAIL);
  set('WAITLIST_NOTIFY_EMAIL', api.WAITLIST_NOTIFY_EMAIL);
  set('MEILISEARCH_URL', api.MEILISEARCH_URL);
  set('MEILISEARCH_MASTER_KEY', api.MEILISEARCH_MASTER_KEY);
  set('MEILISEARCH_INDEX_LAWYERS', api.MEILISEARCH_INDEX_LAWYERS);
  set('MEILISEARCH_INDEX_JUDGMENTS', api.MEILISEARCH_INDEX_JUDGMENTS);
  set('AWS_ACCESS_KEY_ID', api.AWS_ACCESS_KEY_ID);
  set('AWS_SECRET_ACCESS_KEY', api.AWS_SECRET_ACCESS_KEY);
  set('AWS_REGION', api.AWS_REGION);
  set('AWS_S3_BUCKET', api.AWS_S3_BUCKET);
  set('GOOGLE_CLOUD_VISION_API_KEY', api.GOOGLE_CLOUD_VISION_API_KEY);
  set('OPENAI_API_KEY', api.OPENAI_API_KEY);
  set('ANTHROPIC_API_KEY', api.ANTHROPIC_API_KEY);
  set('RAZORPAY_KEY_ID', api.RAZORPAY_KEY_ID);
  set('RAZORPAY_KEY_SECRET', api.RAZORPAY_KEY_SECRET);
  set('RAZORPAY_WEBHOOK_SECRET', api.RAZORPAY_WEBHOOK_SECRET);
  set('INTERNAL_CRON_SECRET', api.INTERNAL_CRON_SECRET);
  set('VAPID_PUBLIC_KEY', api.VAPID_PUBLIC_KEY);
  set('VAPID_PRIVATE_KEY', api.VAPID_PRIVATE_KEY);
  set('VAPID_SUBJECT', api.VAPID_SUBJECT);
  set('LIVEKIT_URL', api.LIVEKIT_URL);
  set('LIVEKIT_API_KEY', api.LIVEKIT_API_KEY);
  set('LIVEKIT_API_SECRET', api.LIVEKIT_API_SECRET);
  set('WHATSAPP_API_TOKEN', api.WHATSAPP_API_TOKEN);
  set('WHATSAPP_PHONE_NUMBER_ID', api.WHATSAPP_PHONE_NUMBER_ID);
  set('WHATSAPP_VERIFY_TOKEN', api.WHATSAPP_VERIFY_TOKEN);
  set('WHATSAPP_APP_SECRET', api.WHATSAPP_APP_SECRET);
  set('NJDG_BRIDGE_URL', api.NJDG_BRIDGE_URL);
  set('NJDG_BRIDGE_SECRET', api.NJDG_BRIDGE_SECRET);
  set('UPSTASH_REDIS_URL', api.UPSTASH_REDIS_URL);
  set('UPSTASH_REDIS_TOKEN', api.UPSTASH_REDIS_TOKEN);
  set('VAULT_MALWARE_SCAN_PROVIDER', api.VAULT_MALWARE_SCAN_PROVIDER);
}

/**
 * Minimal ProcessEnv view for integration parsers that only read known keys.
 */
export function integrationEnvFromApi(api: ApiEnv): NodeJS.ProcessEnv {
  return {
    ...process.env,
    MEILISEARCH_URL: api.MEILISEARCH_URL,
    MEILISEARCH_MASTER_KEY: api.MEILISEARCH_MASTER_KEY,
    AWS_ACCESS_KEY_ID: api.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: api.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: api.AWS_REGION,
    AWS_S3_BUCKET: api.AWS_S3_BUCKET,
  } as NodeJS.ProcessEnv;
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
