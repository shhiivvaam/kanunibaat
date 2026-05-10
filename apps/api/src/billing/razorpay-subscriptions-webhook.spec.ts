import type { Request, Response } from 'express';

import { computeRazorpayWebhookSignature } from './razorpay-webhook';
import { createRazorpaySubscriptionsWebhookHandler } from './razorpay-subscriptions-webhook';

jest.mock('./billing-email', () => ({
  sendBillingReceiptEmail: jest.fn(async () => {}),
}));

jest.mock('@jurisly/database', () => {
  const actual: unknown = jest.requireActual('@jurisly/database');
  let inserted = false;
  const tx = {
    insert: () => ({
      values: () => ({
        onConflictDoNothing: () => ({
          returning: () => {
            if (inserted) return [];
            inserted = true;
            return [{ id: 'ev-1' }];
          },
        }),
      }),
    }),
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () =>
            Promise.resolve([
              {
                id: 'sub-1',
                userId: 'user-1',
                currentPeriodStartAt: null,
                currentPeriodEndAt: null,
              },
            ]),
        }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: async () => {},
      }),
    }),
  };
  const db = {
    transaction: (fn: (txArg: typeof tx) => Promise<unknown>) => fn(tx),
  };
  return { ...(actual as object), db };
});

describe('Phase 13 Razorpay subscriptions webhook', () => {
  it('is idempotent for identical bodies', async () => {
    const secret = 'whsec_test';
    const payload = Buffer.from(
      JSON.stringify({
        event: 'subscription.charged',
        created_at: 1_700_000_000,
        payload: {
          subscription: { entity: { id: 'sub_rp_1', status: 'active' } },
          payment: { entity: { id: 'pay_1', amount: 19900, currency: 'INR' } },
        },
      }),
      'utf8',
    );
    const sig = computeRazorpayWebhookSignature({ secret, body: payload });

    const handler = createRazorpaySubscriptionsWebhookHandler({
      webhookSecret: secret,
    });

    const req = {
      body: payload,
      header: (name: string) =>
        name === 'x-razorpay-signature' ? sig : undefined,
    } as unknown as Request;
    const res = {
      status: () => res,
      json: () => res,
    } as unknown as Response;

    await handler(req, res, () => {});
    await handler(req, res, () => {});
  });
});
