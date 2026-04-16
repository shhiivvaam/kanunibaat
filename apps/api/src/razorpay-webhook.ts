import crypto from 'node:crypto';
import type { RequestHandler } from 'express';
import { and, eq, sum } from 'drizzle-orm';

import { db, schema } from '@kb/database';

function safeTimingEqualHex(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export function computeRazorpayWebhookSignature(opts: {
  secret: string;
  body: Buffer;
}): string {
  return crypto.createHmac('sha256', opts.secret).update(opts.body).digest('hex');
}

export function verifyRazorpayWebhookSignature(opts: {
  secret: string;
  body: Buffer;
  signatureHeader: string | undefined;
}): boolean {
  if (!opts.signatureHeader) return false;
  const expected = computeRazorpayWebhookSignature({ secret: opts.secret, body: opts.body });
  return safeTimingEqualHex(expected, opts.signatureHeader);
}

type RazorpayWebhookEvent =
  | 'payment.captured'
  | 'payment.failed'
  | 'refund.processed'
  | string;

interface RazorpayWebhookPayload {
  event: RazorpayWebhookEvent;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        status?: string;
      };
    };
  };
}

export function createRazorpayWebhookHandler(opts: {
  webhookSecret: string;
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

    const orderId = parsed.payload?.payment?.entity?.order_id;
    const paymentId = parsed.payload?.payment?.entity?.id;
    if (!orderId || !paymentId) {
      res.status(200).json({ ok: true });
      return;
    }

    if (parsed.event === 'payment.captured') {
      await db.transaction(async (tx) => {
        const rows = await tx
          .select()
          .from(schema.payment)
          .where(eq(schema.payment.razorpayOrderId, orderId))
          .limit(1);
        const row = rows[0];
        if (row) {
          if (row.status === 'paid' || row.status === 'released') return;

          await tx
            .update(schema.payment)
            .set({
              status: 'paid',
              razorpayPaymentId: paymentId,
              paidAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(schema.payment.id, row.id));

          await tx
            .update(schema.consultation)
            .set({ status: 'scheduled', updatedAt: new Date() })
            .where(eq(schema.consultation.id, row.consultationId));
          return;
        }

        const invPayRows = await tx
          .select()
          .from(schema.lawyerInvoicePayment)
          .where(eq(schema.lawyerInvoicePayment.razorpayOrderId, orderId))
          .limit(1);
        const invPay = invPayRows[0];
        if (!invPay) return;
        if (invPay.status === 'paid') return;

        const paidAt = new Date();
        await tx
          .update(schema.lawyerInvoicePayment)
          .set({
            status: 'paid',
            razorpayPaymentId: paymentId,
            paidAt,
            updatedAt: paidAt,
          })
          .where(eq(schema.lawyerInvoicePayment.id, invPay.id));

        const [inv] = await tx
          .select()
          .from(schema.lawyerInvoice)
          .where(eq(schema.lawyerInvoice.id, invPay.invoiceId))
          .limit(1);
        if (!inv) return;

        const [agg] = await tx
          .select({ s: sum(schema.lawyerInvoicePayment.amountInr) })
          .from(schema.lawyerInvoicePayment)
          .where(
            and(
              eq(schema.lawyerInvoicePayment.invoiceId, inv.id),
              eq(schema.lawyerInvoicePayment.status, 'paid'),
            ),
          );
        const paidSum = Number(agg?.s ?? 0);
        let status = inv.status;
        if (paidSum >= inv.totalInr) status = 'paid';
        else if (paidSum > 0) status = 'partially_paid';
        await tx
          .update(schema.lawyerInvoice)
          .set({ status, updatedAt: new Date() })
          .where(eq(schema.lawyerInvoice.id, inv.id));
      });
    }

    if (parsed.event === 'payment.failed') {
      await db.transaction(async (tx) => {
        const rows = await tx
          .select()
          .from(schema.payment)
          .where(eq(schema.payment.razorpayOrderId, orderId))
          .limit(1);
        const row = rows[0];
        if (row) {
          if (row.status !== 'created') return;

          await tx
            .update(schema.payment)
            .set({
              status: 'failed',
              razorpayPaymentId: paymentId,
              updatedAt: new Date(),
            })
            .where(eq(schema.payment.id, row.id));
          return;
        }

        const invPayRows = await tx
          .select()
          .from(schema.lawyerInvoicePayment)
          .where(eq(schema.lawyerInvoicePayment.razorpayOrderId, orderId))
          .limit(1);
        const invPay = invPayRows[0];
        if (!invPay) return;
        if (invPay.status !== 'created') return;

        await tx
          .update(schema.lawyerInvoicePayment)
          .set({
            status: 'failed',
            razorpayPaymentId: paymentId,
            updatedAt: new Date(),
          })
          .where(eq(schema.lawyerInvoicePayment.id, invPay.id));
      });
    }

    res.status(200).json({ ok: true });
  };
}

