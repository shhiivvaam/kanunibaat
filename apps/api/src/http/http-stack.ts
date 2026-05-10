import { randomUUID } from 'node:crypto';

import type { INestApplication } from '@nestjs/common';
import type { Application, RequestHandler } from 'express';
import express from 'express';
import rateLimit from 'express-rate-limit';
import type { AnyRouter } from '@trpc/server';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import type { Logger } from 'pino';
import pinoHttp from 'pino-http';

import * as Sentry from '@sentry/node';

import {
  appRouter,
  createTrpcContextFactory,
  type TrpcContext,
} from '@jurisly/trpc';

import type { ConsultationChatFanout } from '../consultation/consultation-chat-fanout';
import { attachConsultationChatSse } from '../consultation/consultation-chat-sse';

import { createCaseTrackerPollHandler } from '../case-tracker/case-tracker-poll';
import { createNotificationsDispatchHandler } from '../notifications/notifications-dispatch';
import { createRazorpayWebhookHandler } from '../billing/razorpay-webhook';
import { createRazorpaySubscriptionsWebhookHandler } from '../billing/razorpay-subscriptions-webhook';
import { createWhatsAppWebhookHandlers } from '../whatsapp/webhook';

import type { ApiEnv } from '../config/env';

export type TrpcContextCreator = ReturnType<typeof createTrpcContextFactory>;

export function attachPublicHttpMiddlewares(
  app: INestApplication,
  opts: {
    logger: Logger;
    createTrpcContext: TrpcContextCreator;
    consultationChatFanout: ConsultationChatFanout;
    apiEnv: ApiEnv;
  },
): void {
  const httpServer = app.getHttpAdapter().getInstance() as Application;

  attachConsultationChatSse(httpServer, {
    fanout: opts.consultationChatFanout,
  });

  httpServer.use(
    pinoHttp({
      logger: opts.logger,
      genReqId: (req) => {
        const raw =
          req.headers['x-request-id'] ?? req.headers['x-correlation-id'];
        if (typeof raw === 'string' && raw.length > 0 && raw.length <= 200) {
          return raw;
        }
        return randomUUID();
      },
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
        if (u.includes('emergencyGuide.personalize')) return 5;
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
        if (u.includes('notices.requestUpload')) return 15;
        if (u.includes('notices.process')) return 10;
        if (u.includes('consultations.chat.sendMessage')) return 120;
        if (u.includes('consultations.submitVerifiedReview')) return 15;
        if (u.includes('consultations.liveKit')) return 20;
        if (u.includes('marketplace.searchLawyers')) return 60;
        return 120;
      },
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  const trpcMiddleware: RequestHandler = createExpressMiddleware({
    router: appRouter as AnyRouter,
    createContext: opts.createTrpcContext,
    onError({ error, type, path, ctx: rawCtx }) {
      const ctx = rawCtx as TrpcContext | undefined;
      opts.logger.error(
        {
          type,
          path,
          correlationId: ctx?.correlationId ?? null,
          userId: ctx?.authUserId ?? null,
          error: {
            message: error.message,
            stack: error.stack,
            code: error.code,
            cause: error.cause,
          },
        },
        'tRPC error',
      );

      Sentry.captureException(error, {
        tags: {
          trpc_path: path ?? 'unknown',
          trpc_type: type,
          trpc_code: error.code,
          correlation_id: ctx?.correlationId ?? 'none',
        },
        user: ctx?.authUserId ? { id: ctx.authUserId } : undefined,
      });
    },
    responseMeta() {
      return {};
    },
  });
  httpServer.use('/trpc', trpcMiddleware);

  const webhookSecret = opts.apiEnv.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (webhookSecret) {
    httpServer.post(
      '/webhooks/razorpay',
      express.raw({ type: 'application/json' }),
      createRazorpayWebhookHandler({ webhookSecret }),
    );
    httpServer.post(
      '/webhooks/razorpay/subscriptions',
      express.raw({ type: 'application/json' }),
      createRazorpaySubscriptionsWebhookHandler({
        webhookSecret,
        resendApiKey: opts.apiEnv.RESEND_API_KEY,
        fromEmail: opts.apiEnv.FROM_EMAIL,
      }),
    );
  }

  const waToken = opts.apiEnv.WHATSAPP_API_TOKEN?.trim();
  const waPhoneId = opts.apiEnv.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const waVerify = opts.apiEnv.WHATSAPP_VERIFY_TOKEN?.trim();
  const waAppSecret = opts.apiEnv.WHATSAPP_APP_SECRET?.trim();
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

  const internalCronSecret = opts.apiEnv.INTERNAL_CRON_SECRET?.trim();
  if (internalCronSecret) {
    httpServer.post(
      '/internal/notifications/dispatch',
      express.json({ limit: '1mb' }),
      createNotificationsDispatchHandler({
        internalSecret: internalCronSecret,
        vapidPublicKey: opts.apiEnv.VAPID_PUBLIC_KEY,
        vapidPrivateKey: opts.apiEnv.VAPID_PRIVATE_KEY,
        vapidSubject: opts.apiEnv.VAPID_SUBJECT,
      }),
    );
    httpServer.post(
      '/internal/case-tracker/poll',
      express.json({ limit: '1mb' }),
      createCaseTrackerPollHandler({
        internalSecret: internalCronSecret,
        njdgBridgeUrl: opts.apiEnv.NJDG_BRIDGE_URL?.trim() ?? null,
        njdgBridgeSecret: opts.apiEnv.NJDG_BRIDGE_SECRET?.trim() ?? null,
      }),
    );
  }
}
