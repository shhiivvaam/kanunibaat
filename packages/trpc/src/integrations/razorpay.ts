import crypto from 'node:crypto';

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

export function requireConfiguredRazorpay(ctx: { razorpayKeyId: string | null; razorpayKeySecret: string | null }) {
  const idRaw = ctx.razorpayKeyId?.trim();
  const secretRaw = ctx.razorpayKeySecret?.trim();
  const id = idRaw && idRaw.length > 0 ? idRaw : null;
  const secret = secretRaw && secretRaw.length > 0 ? secretRaw : null;
  if (!id || !secret) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'Payments are not configured.',
    });
  }
  return { id, secret };
}

export function computeRazorpayClientSignature(opts: { secret: string; orderId: string; paymentId: string }): string {
  const msg = `${opts.orderId}|${opts.paymentId}`;
  return crypto.createHmac('sha256', opts.secret).update(msg).digest('hex');
}

export async function createRazorpayOrder(opts: {
  keyId: string;
  keySecret: string;
  amountPaise: number;
  currency: string;
  receipt: string;
}) {
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      authorization: `Basic ${Buffer.from(`${opts.keyId}:${opts.keySecret}`).toString('base64')}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      amount: opts.amountPaise,
      currency: opts.currency,
      receipt: opts.receipt,
      payment_capture: 1,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Razorpay order creation failed (${res.status}). ${text}`,
    });
  }
  const json = (await res.json()) as unknown;
  const parsed = z
    .object({
      id: z.string().min(1),
      amount: z.number().int().positive(),
      currency: z.string().min(1),
    })
    .safeParse(json);
  if (!parsed.success) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Invalid Razorpay response.' });
  }
  return parsed.data;
}
