import type { INestApplication } from '@nestjs/common';
import type { Application, RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import type { AnyRouter } from '@trpc/server';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import type { Logger } from 'pino';
import pinoHttp from 'pino-http';

import { appRouter, createTrpcContextFactory } from '@kb/trpc';

export type TrpcContextCreator = ReturnType<typeof createTrpcContextFactory>;

export function attachPublicHttpMiddlewares(
  app: INestApplication,
  opts: { logger: Logger; createTrpcContext: TrpcContextCreator },
): void {
  const httpServer = app.getHttpAdapter().getInstance() as Application;

  httpServer.use(
    pinoHttp({
      logger: opts.logger,
      autoLogging: {
        ignore: (req) =>
          req.url === '/' ||
          req.url === '/health' ||
          req.url?.startsWith('/health') === true,
      },
    }),
  );

  httpServer.use(
    '/trpc',
    rateLimit({
      windowMs: 60_000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  const trpcMiddleware: RequestHandler = createExpressMiddleware({
    router: appRouter as AnyRouter,
    createContext: opts.createTrpcContext,
  });
  httpServer.use('/trpc', trpcMiddleware);
}
