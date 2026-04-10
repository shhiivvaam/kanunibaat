import type { Application, RequestHandler } from 'express';
import { NestFactory } from '@nestjs/core';
import * as Sentry from '@sentry/node';
import type { AnyRouter } from '@trpc/server';
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

function resolveCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN;
  if (!raw) return ['http://localhost:3000'];
  const parsed = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : ['http://localhost:3000'];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: resolveCorsOrigins(), credentials: true });

  const httpServer = app.getHttpAdapter().getInstance() as Application;
  const trpcMiddleware: RequestHandler = createExpressMiddleware({
    router: appRouter as AnyRouter,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- pnpm workspace: ESLint TS program mis-resolves `@kb/trpc` (tsc is clean)
    createContext: createTrpcContext,
  });
  httpServer.use('/trpc', trpcMiddleware);

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
}

void bootstrap();
