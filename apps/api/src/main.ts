import type { Application } from 'express';
import { NestFactory } from '@nestjs/core';
import * as Sentry from '@sentry/node';
import { createExpressMiddleware } from '@trpc/server/adapters/express';

import { AppModule } from './app.module';
import { appRouter, createTrpcContext } from '@kb/trpc';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0),
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOrigins =
    process.env.CORS_ORIGIN?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) ?? ['http://localhost:3000'];
  app.enableCors({ origin: corsOrigins, credentials: true });

  const httpServer = app.getHttpAdapter().getInstance() as Application;
  httpServer.use(
    '/trpc',
    createExpressMiddleware({
      router: appRouter,
      createContext: createTrpcContext,
    }),
  );

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
}

void bootstrap();
