import type { Request, Response } from 'express';

import { createWhatsAppWebhookHandlers } from './webhook';
import { handleWhatsAppInboundMessage } from './bot';
import { sendWhatsAppText } from './cloud-api';

jest.mock('./cloud-api', () => ({
  sendWhatsAppText: jest.fn(() =>
    Promise.resolve({ ok: true, messageId: 'out-1' }),
  ),
}));

function drizzleTableName(table: unknown): string {
  if (typeof table !== 'object' || table === null) return '';
  const record = table as Record<string, unknown>;
  const underscore = record._;
  if (
    typeof underscore === 'object' &&
    underscore !== null &&
    'name' in underscore
  ) {
    const n = (underscore as { name?: unknown }).name;
    if (typeof n === 'string') return n;
  }
  const sym = Symbol.for('drizzle:Name');
  const viaSym = (table as Record<PropertyKey, unknown>)[sym];
  if (typeof viaSym === 'string') return viaSym;
  return '';
}

jest.mock('@jurisly/database', () => {
  const actual =
    jest.requireActual<typeof import('@jurisly/database')>('@jurisly/database');
  const conversations: Array<Record<string, unknown>> = [];
  const messages: Array<Record<string, unknown>> = [];

  const dbMock = {
    select: () => ({
      from: (t: unknown) => ({
        where: () => ({
          limit: () => {
            const tableName = drizzleTableName(t);
            if (tableName === 'whatsapp_message')
              return Promise.resolve(messages.slice(0, 1));
            if (tableName === 'whatsapp_conversation')
              return Promise.resolve(conversations.slice(0, 1));
            return Promise.resolve([]);
          },
        }),
      }),
    }),
    insert: (t: unknown) => ({
      values: (v: Record<string, unknown>) => {
        const tableName = drizzleTableName(t);
        if (tableName === 'whatsapp_message') {
          messages.push({ id: `m-${messages.length + 1}`, ...v });
          return Promise.resolve();
        }
        if (tableName === 'whatsapp_conversation') {
          const row = { id: `c-${conversations.length + 1}`, ...v };
          conversations.push(row);
          return {
            returning: () => Promise.resolve([row]),
          };
        }
        return Promise.resolve();
      },
    }),
    update: () => ({
      set: () => ({
        where: () => Promise.resolve(),
      }),
    }),
  };

  return { ...actual, db: dbMock };
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

    const send = jest.fn();
    const res = {
      status: () => res,
      send,
      json: jest.fn(),
    } as unknown as Response;

    await h.verify(req, res, () => {});
    expect(send).toHaveBeenCalledWith('12345');
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

    expect(jest.mocked(sendWhatsAppText).mock.calls.length).toBe(1);
  });
});
