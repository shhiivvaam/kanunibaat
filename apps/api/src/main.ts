import { NestFactory } from '@nestjs/core';
import * as Sentry from '@sentry/node';
import pino from 'pino';

import { db } from '@jurisly/database';
import {
  DEFAULT_JUDGMENTS_INDEX,
  DEFAULT_LAWYERS_INDEX,
  parseMeiliConfigFromEnv,
} from '@jurisly/search';
import { parseS3DocumentsConfigFromEnv } from '@jurisly/storage';
import { createTrpcContextFactory } from '@jurisly/trpc';

import { AppModule } from './app.module';
import { createConsultationChatFanout } from './consultation/consultation-chat-fanout';
import {
  applyApiEnvToProcessEnv,
  buildWaitlistEnv,
  integrationEnvFromApi,
  loadApiEnv,
} from './config/env';
import { attachPublicHttpMiddlewares } from './http/http-stack';
import { attachOpenApiDocs } from './http/open-api';

const apiEnv = loadApiEnv();
applyApiEnvToProcessEnv(apiEnv);

if (apiEnv.SENTRY_DSN) {
  Sentry.init({
    dsn: apiEnv.SENTRY_DSN,
    environment: apiEnv.SENTRY_ENVIRONMENT ?? apiEnv.NODE_ENV,
    tracesSampleRate: apiEnv.SENTRY_TRACES_SAMPLE_RATE,
  });
}

function resolveCorsOrigins(): string[] {
  const raw = apiEnv.CORS_ORIGIN;
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

  const integrationEnv = integrationEnvFromApi(apiEnv);
  const meili = parseMeiliConfigFromEnv(integrationEnv);
  const meiliIndexName =
    apiEnv.MEILISEARCH_INDEX_LAWYERS?.trim() || DEFAULT_LAWYERS_INDEX;
  const meiliJudgmentsIndexName =
    apiEnv.MEILISEARCH_INDEX_JUDGMENTS?.trim() || DEFAULT_JUDGMENTS_INDEX;

  const consultationChatFanout = createConsultationChatFanout();

  const trpcLogger = {
    info(meta: Record<string, unknown>, msg?: string) {
      if (msg) logger.info(meta, msg);
      else logger.info(meta);
    },
    error(meta: Record<string, unknown>, msg?: string) {
      if (msg) logger.error(meta, msg);
      else logger.error(meta);
    },
  };

  const createTrpcContext = createTrpcContextFactory({
    db,
    logger: trpcLogger,
    notifyConsultationChatSubscribers: (consultationId) =>
      consultationChatFanout.emit(consultationId),
    waitlistEnv: buildWaitlistEnv(apiEnv),
    meili,
    meiliIndexName,
    meiliJudgmentsIndexName,
    s3Documents: parseS3DocumentsConfigFromEnv(integrationEnv),
    googleVisionApiKey: apiEnv.GOOGLE_CLOUD_VISION_API_KEY?.trim() || null,
    openaiApiKey: apiEnv.OPENAI_API_KEY?.trim() || null,
    razorpayKeyId: apiEnv.RAZORPAY_KEY_ID?.trim() || null,
    razorpayKeySecret: apiEnv.RAZORPAY_KEY_SECRET?.trim() || null,
    livekitUrl: apiEnv.LIVEKIT_URL?.trim() || null,
    livekitApiKey: apiEnv.LIVEKIT_API_KEY?.trim() || null,
    livekitApiSecret: apiEnv.LIVEKIT_API_SECRET?.trim() || null,
    njdgBridgeUrl: apiEnv.NJDG_BRIDGE_URL?.trim() || null,
    njdgBridgeSecret: apiEnv.NJDG_BRIDGE_SECRET?.trim() || null,
  });

  attachPublicHttpMiddlewares(app, {
    logger,
    createTrpcContext,
    consultationChatFanout,
    apiEnv,
  });

  const port = apiEnv.PORT;
  await app.listen(port);
  logger.info({ port }, 'api listening');
}

void bootstrap();
