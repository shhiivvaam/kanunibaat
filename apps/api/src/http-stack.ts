import type { INestApplication } from '@nestjs/common';
import type { Application, RequestHandler } from 'express';
import express from 'express';
import rateLimit from 'express-rate-limit';
import type { AnyRouter } from '@trpc/server';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import type { Logger } from 'pino';
import pinoHttp from 'pino-http';

import { appRouter, createTrpcContextFactory } from '@kb/trpc';

import { createRazorpayWebhookHandler } from './razorpay-webhook';

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
      max: (req) => {
        const u = req.url ?? '';
        if (typeof u !== 'string') return 120;
        if (u.includes('emergencyGuide.personalize')) return 25;
        if (u.includes('vault.document.summarize') || u.includes('vault.share.get')) return 30;
        return 120;
      },
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  const trpcMiddleware: RequestHandler = createExpressMiddleware({
    router: appRouter as AnyRouter,
    createContext: opts.createTrpcContext,
  });
  httpServer.use('/trpc', trpcMiddleware);

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (webhookSecret) {
    httpServer.post(
      '/webhooks/razorpay',
      express.raw({ type: 'application/json' }),
      createRazorpayWebhookHandler({ webhookSecret }),
    );
  }
}
