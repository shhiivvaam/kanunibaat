import { NestFactory } from '@nestjs/core';
import * as Sentry from '@sentry/node';
import pino from 'pino';

import { db } from '@kb/database';
import { DEFAULT_JUDGMENTS_INDEX, DEFAULT_LAWYERS_INDEX, parseMeiliConfigFromEnv } from '@kb/search';
import { parseS3DocumentsConfigFromEnv } from '@kb/storage';
import { createTrpcContextFactory } from '@kb/trpc';

import { AppModule } from './app.module';
import { buildWaitlistEnv, loadApiEnv } from './env';
import { attachPublicHttpMiddlewares } from './http-stack';
import { attachOpenApiDocs } from './open-api';

const apiEnv = loadApiEnv();

if (apiEnv.SENTRY_DSN) {
  Sentry.init({
    dsn: apiEnv.SENTRY_DSN,
    environment: apiEnv.SENTRY_ENVIRONMENT ?? apiEnv.NODE_ENV,
    tracesSampleRate: apiEnv.SENTRY_TRACES_SAMPLE_RATE,
  });
}

function resolveCorsOrigins(): string[] {
  const raw = apiEnv.CORS_ORIGIN ?? process.env.CORS_ORIGIN;
  if (!raw) return ['http://localhost:3000'];
  const parsed = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : ['http://localhost:3000'];
}

async function bootstrap() {
  const logger = pino({
    level: apiEnv.NODE_ENV === 'production' ? 'info' : 'debug',
    redact: ['req.headers.authorization', 'req.headers.cookie'],
  });

  const app = await NestFactory.create(AppModule, { logger: false });
  app.enableCors({ origin: resolveCorsOrigins(), credentials: true });

  attachOpenApiDocs(app);

  const meili = parseMeiliConfigFromEnv(process.env);
  const meiliIndexName =
    apiEnv.MEILISEARCH_INDEX_LAWYERS?.trim() || DEFAULT_LAWYERS_INDEX;
  const meiliJudgmentsIndexName =
    apiEnv.MEILISEARCH_INDEX_JUDGMENTS?.trim() || DEFAULT_JUDGMENTS_INDEX;

  const createTrpcContext = createTrpcContextFactory({
    db,
    waitlistEnv: buildWaitlistEnv(apiEnv),
    meili,
    meiliIndexName,
    meiliJudgmentsIndexName,
    s3Documents: parseS3DocumentsConfigFromEnv(process.env),
    googleVisionApiKey: apiEnv.GOOGLE_CLOUD_VISION_API_KEY?.trim() || null,
    openaiApiKey: apiEnv.OPENAI_API_KEY?.trim() || null,
    razorpayKeyId: apiEnv.RAZORPAY_KEY_ID?.trim() || null,
    razorpayKeySecret: apiEnv.RAZORPAY_KEY_SECRET?.trim() || null,
    livekitUrl: apiEnv.LIVEKIT_URL?.trim() || null,
    livekitApiKey: apiEnv.LIVEKIT_API_KEY?.trim() || null,
    livekitApiSecret: apiEnv.LIVEKIT_API_SECRET?.trim() || null,
    njdgBridgeUrl: process.env.NJDG_BRIDGE_URL?.trim() || null,
    njdgBridgeSecret: process.env.NJDG_BRIDGE_SECRET?.trim() || null,
  });

  attachPublicHttpMiddlewares(app, { logger, createTrpcContext });

  const port = apiEnv.PORT;
  await app.listen(port);
  logger.info({ port }, 'api listening');
}

void bootstrap();
