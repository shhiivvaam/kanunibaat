import crypto from 'node:crypto';
import type { RequestHandler } from 'express';
import { eq } from 'drizzle-orm';

import { db, schema } from '@jurisly/database';

import { sendBillingReceiptEmail } from './billing-email';
import { verifyRazorpayWebhookSignature } from './razorpay-webhook';

function sha256Hex(buf: Buffer): string {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

type RazorpayEventName = string;

interface RazorpayWebhookPayload {
  event: RazorpayEventName;
  created_at?: number;
  payload?: {
    subscription?: {
      entity?: {
        id?: string;
        status?: string;
        current_start?: number;
        current_end?: number;
      };
    };
    payment?: {
      entity?: {
        id?: string;
        amount?: number;
        currency?: string;
        status?: string;
      };
    };
    invoice?: {
      entity?: {
        id?: string;
        amount_paid?: number;
        currency?: string;
        status?: string;
      };
    };
  };
}

function mapSubscriptionStatus(
  s: string | undefined,
): (typeof schema.kbSubscription)['status']['enumValues'][number] {
  const status = (s ?? '').toLowerCase();
  if (status === 'active') return 'active';
  if (status === 'halted') return 'paused';
  if (status === 'cancelled') return 'cancelled';
  if (status === 'paused') return 'paused';
  return 'pending';
}

export function createRazorpaySubscriptionsWebhookHandler(opts: {
  webhookSecret: string;
  resendApiKey?: string | null;
  fromEmail?: string | null;
}): RequestHandler {
  return async (req, res) => {
    const body = req.body as Buffer;
    const signature = req.header('x-razorpay-signature') ?? undefined;

    const isValid = verifyRazorpayWebhookSignature({
      secret: opts.webhookSecret,
      body,
      signatureHeader: signature,
    });
    if (!isValid) {
      res.status(401).json({ ok: false });
      return;
    }

    let parsed: RazorpayWebhookPayload;
    try {
      parsed = JSON.parse(body.toString('utf8')) as RazorpayWebhookPayload;
    } catch {
      res.status(400).json({ ok: false });
      return;
    }

    const providerEventId = sha256Hex(body);
    const eventType = parsed.event ?? 'unknown';
    const occurredAt = parsed.created_at
      ? new Date(parsed.created_at * 1000)
      : new Date();

    const subscriptionId = parsed.payload?.subscription?.entity?.id ?? null;
    const rpStatus = parsed.payload?.subscription?.entity?.status;
    const payment = parsed.payload?.payment?.entity;
    const invoice = parsed.payload?.invoice?.entity;

    const amountPaise = payment?.amount ?? invoice?.amount_paid ?? null;
    const currency = payment?.currency ?? invoice?.currency ?? null;
    const amountInr =
      amountPaise == null ? null : Math.round(amountPaise / 100);

    await db.transaction(async (tx) => {
      // Idempotency: event ledger insert first.
      const [ev] = await tx
        .insert(schema.kbBillingEvent)
        .values({
          provider: 'razorpay',
          providerEventId,
          type: eventType,
          subscriptionId,
          amountInr,
          currency,
          occurredAt,
          payloadJson: parsed as unknown as Record<string, unknown>,
        })
        .onConflictDoNothing()
        .returning();

      if (!ev) return;

      if (!subscriptionId) return;

      const [sub] = await tx
        .select()
        .from(schema.kbSubscription)
        .where(eq(schema.kbSubscription.razorpaySubscriptionId, subscriptionId))
        .limit(1);
      if (!sub) return;

      await tx
        .update(schema.kbBillingEvent)
        .set({ userId: sub.userId })
        .where(eq(schema.kbBillingEvent.id, ev.id));

      const status = mapSubscriptionStatus(rpStatus);
      const start = parsed.payload?.subscription?.entity?.current_start
        ? new Date(parsed.payload.subscription.entity.current_start * 1000)
        : null;
      const end = parsed.payload?.subscription?.entity?.current_end
        ? new Date(parsed.payload.subscription.entity.current_end * 1000)
        : null;

      await tx
        .update(schema.kbSubscription)
        .set({
          status,
          currentPeriodStartAt: start ?? sub.currentPeriodStartAt,
          currentPeriodEndAt: end ?? sub.currentPeriodEndAt,
          updatedAt: new Date(),
        })
        .where(eq(schema.kbSubscription.id, sub.id));

      if (eventType.includes('charged') || eventType.includes('paid')) {
        const [u] = await tx
          .select({ email: schema.user.email })
          .from(schema.user)
          .where(eq(schema.user.id, sub.userId))
          .limit(1);
        if (u?.email) {
          const subject = 'Jurisly subscription receipt';
          const text = [
            'Thanks for your subscription.',
            '',
            `Subscription: ${subscriptionId}`,
            amountInr != null ? `Amount: ₹${amountInr}` : null,
            currency ? `Currency: ${currency}` : null,
            `Date: ${occurredAt.toISOString()}`,
            '',
            'You can view your billing history in the app.',
          ]
            .filter(Boolean)
            .join('\n');

          await sendBillingReceiptEmail({
            resendApiKey: opts.resendApiKey ?? undefined,
            fromEmail: opts.fromEmail ?? undefined,
            toEmail: u.email,
            subject,
            text,
          });
        }
      }
    });

    res.status(200).json({ ok: true });
  };
}
