import type { Request, Response } from 'express';

import { createWhatsAppWebhookHandlers } from './whatsapp/webhook';
import { handleWhatsAppInboundMessage } from './whatsapp/bot';
import { sendWhatsAppText } from './whatsapp/cloud-api';

jest.mock('./whatsapp/cloud-api', () => ({
  sendWhatsAppText: jest.fn(async () => ({ ok: true, messageId: 'out-1' })),
}));

jest.mock('@kb/database', () => {
  const actual: unknown = jest.requireActual('@kb/database');
  const conversations: Array<Record<string, unknown>> = [];
  const messages: Array<Record<string, unknown>> = [];

  const dbMock = {
    select: () => ({
      from: (t: any) => ({
        where: (cond: any) => ({
          limit: async () => {
            const tableName = t?._?.name ?? t?.[Symbol.for('drizzle:Name')] ?? '';
            if (tableName === 'whatsapp_message') return messages.slice(0, 1);
            if (tableName === 'whatsapp_conversation') return conversations.slice(0, 1);
            return [];
          },
        }),
      }),
    }),
    insert: (t: any) => ({
      values: (v: any) => {
        const tableName = t?._?.name ?? t?.[Symbol.for('drizzle:Name')] ?? '';
        if (tableName === 'whatsapp_message') {
          messages.push({ id: `m-${messages.length + 1}`, ...v });
          return Promise.resolve();
        }
        if (tableName === 'whatsapp_conversation') {
          const row = { id: `c-${conversations.length + 1}`, ...v };
          conversations.push(row);
          return {
            returning: async () => [row],
          };
        }
        return Promise.resolve();
      },
    }),
    update: () => ({
      set: () => ({
        where: async () => { },
      }),
    }),
  };

  return { ...(actual as object), db: dbMock, schema: (actual as any).schema };
});

describe('Phase 15 WhatsApp webhook', () => {
  beforeEach(() => {
    process.env.WHATSAPP_API_TOKEN = 'wa_token';
    process.env.WHATSAPP_PHONE_NUMBER_ID = 'wa_phone';
  });

  it('verifies webhook challenge', async () => {
    const h = createWhatsAppWebhookHandlers({ verifyToken: 'verify-token' });
    const req = {
      query: {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'verify-token',
        'hub.challenge': '12345',
      },
    } as unknown as Request;

    const res = {
      status: () => res,
      send: jest.fn(),
      json: jest.fn(),
    } as unknown as Response;

    await h.verify(req, res, () => { });
    expect((res.send as any).mock.calls[0][0]).toBe('12345');
  });

  it('is idempotent for identical inbound message id', async () => {
    process.env.WHATSAPP_VERIFY_TOKEN = 'verify-token';

    await handleWhatsAppInboundMessage({
      waUserId: 'wa-user-1',
      waMessageId: 'msg-1',
      body: 'en',
      raw: {},
    });

    await handleWhatsAppInboundMessage({
      waUserId: 'wa-user-1',
      waMessageId: 'msg-1',
      body: 'en',
      raw: {},
    });

    expect((sendWhatsAppText as any).mock.calls.length).toBe(1);
  });
});

