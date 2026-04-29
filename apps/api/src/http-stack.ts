import type { INestApplication } from '@nestjs/common';
import type { Application, RequestHandler } from 'express';
import express from 'express';
import rateLimit from 'express-rate-limit';
import type { AnyRouter } from '@trpc/server';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import type { Logger } from 'pino';
import pinoHttp from 'pino-http';

import { appRouter, createTrpcContextFactory } from '@kb/trpc';

import { createCaseTrackerPollHandler } from './case-tracker-poll';
import { createNotificationsDispatchHandler } from './notifications-dispatch';
import { createRazorpayWebhookHandler } from './razorpay-webhook';
import { createRazorpaySubscriptionsWebhookHandler } from './razorpay-subscriptions-webhook';
import { createWhatsAppWebhookHandlers } from './whatsapp/webhook';

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
        if (
          u.includes('vault.document.summarize') ||
          u.includes('vault.share.get')
        )
          return 30;
        if (u.includes('cases.court.lookupByCnr')) return 20;
        if (
          u.includes('research.judgments.summarize') ||
          u.includes('research.citations.suggestChain') ||
          u.includes('research.drafting.fillTemplate')
        ) {
          return 20;
        }
        if (u.includes('research.judgments.search')) return 40;
        if (u.includes('practice.billing.invoice.pdfBase64')) return 30;
        if (u.includes('practice.billing.invoice.createPaymentOrder'))
          return 20;
        if (u.includes('billing.subscription.createOrUpdate')) return 20;
        if (u.includes('billing.subscription.cancel')) return 20;
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
    httpServer.post(
      '/webhooks/razorpay/subscriptions',
      express.raw({ type: 'application/json' }),
      createRazorpaySubscriptionsWebhookHandler({ webhookSecret }),
    );
  }

  const waToken = process.env.WHATSAPP_API_TOKEN?.trim();
  const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const waVerify = process.env.WHATSAPP_VERIFY_TOKEN?.trim();
  const waAppSecret = process.env.WHATSAPP_APP_SECRET?.trim();
  if (waToken && waPhoneId && waVerify) {
    const wa = createWhatsAppWebhookHandlers({
      verifyToken: waVerify,
      appSecret: waAppSecret,
    });
    httpServer.get('/webhooks/whatsapp', wa.verify);
    httpServer.post(
      '/webhooks/whatsapp',
      express.raw({ type: 'application/json' }),
      wa.receive,
    );
  }

  const internalCronSecret = process.env.INTERNAL_CRON_SECRET?.trim();
  if (internalCronSecret) {
    httpServer.post(
      '/internal/notifications/dispatch',
      express.json({ limit: '1mb' }),
      createNotificationsDispatchHandler({
        internalSecret: internalCronSecret,
      }),
    );
    httpServer.post(
      '/internal/case-tracker/poll',
      express.json({ limit: '1mb' }),
      createCaseTrackerPollHandler({ internalSecret: internalCronSecret }),
    );
  }
}
