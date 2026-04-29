import { createHmac, timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';

import { handleWhatsAppInboundMessage } from './bot';

type VerifyQuery = {
  'hub.mode'?: string;
  'hub.verify_token'?: string;
  'hub.challenge'?: string;
};

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

function verifySignature(opts: {
  appSecret: string;
  body: Buffer;
  signatureHeader?: string;
}): boolean {
  const sig = opts.signatureHeader?.trim();
  if (!sig) return false;
  const prefix = 'sha256=';
  if (!sig.startsWith(prefix)) return false;
  const provided = sig.slice(prefix.length);
  const computed = createHmac('sha256', opts.appSecret)
    .update(opts.body)
    .digest('hex');
  return safeEqual(provided, computed);
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function getProp(obj: unknown, key: string): unknown {
  if (!isRecord(obj)) return undefined;
  return obj[key];
}

function getString(obj: unknown, key: string): string | undefined {
  const v = getProp(obj, key);
  return typeof v === 'string' ? v : undefined;
}

function pickTextBody(m: unknown): string | null {
  const text = getProp(m, 'text');
  const t = getString(text, 'body');
  if (typeof t === 'string' && t.trim().length > 0) return t;

  const button = getProp(m, 'button');
  const btn = getString(button, 'text');
  if (typeof btn === 'string' && btn.trim().length > 0) return btn;

  const interactive = getProp(m, 'interactive');
  const buttonReply = getProp(interactive, 'button_reply');
  const listReply = getProp(interactive, 'list_reply');
  const interactiveTitle =
    getString(buttonReply, 'title') ?? getString(listReply, 'title');
  if (
    typeof interactiveTitle === 'string' &&
    interactiveTitle.trim().length > 0
  )
    return interactiveTitle;

  return null;
}

export function createWhatsAppWebhookHandlers(opts: {
  verifyToken: string;
  appSecret?: string;
}): { verify: RequestHandler; receive: RequestHandler } {
  const verify: RequestHandler = (req, res) => {
    const q = req.query as VerifyQuery;
    const mode = q['hub.mode'];
    const token = q['hub.verify_token'];
    const challenge = q['hub.challenge'];
    if (
      mode === 'subscribe' &&
      token &&
      safeEqual(token, opts.verifyToken) &&
      typeof challenge === 'string'
    ) {
      res.status(200).send(challenge);
      return;
    }
    res.status(403).json({ ok: false });
  };

  const receive: RequestHandler = async (req, res) => {
    const apiToken = process.env.WHATSAPP_API_TOKEN?.trim();
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
    if (!apiToken || !phoneNumberId) {
      res.status(204).send('');
      return;
    }

    const bodyBuf = Buffer.isBuffer(req.body)
      ? req.body
      : Buffer.from(String(req.body ?? ''), 'utf8');
    if (opts.appSecret) {
      const sig = req.header('x-hub-signature-256') ?? undefined;
      if (
        !verifySignature({
          appSecret: opts.appSecret,
          body: bodyBuf,
          signatureHeader: sig,
        })
      ) {
        res.status(401).json({ ok: false });
        return;
      }
    }

    const json = JSON.parse(bodyBuf.toString('utf8')) as unknown;
    const entryVal = getProp(json, 'entry');
    const entries = Array.isArray(entryVal) ? entryVal : [];

    for (const entry of entries) {
      const changesVal = getProp(entry, 'changes');
      const changes = Array.isArray(changesVal) ? changesVal : [];
      for (const ch of changes) {
        const value = getProp(ch, 'value');
        const messagesVal = getProp(value, 'messages');
        const messages = Array.isArray(messagesVal) ? messagesVal : [];
        for (const m of messages) {
          const waUserId = getString(m, 'from');
          const waMessageId = getString(m, 'id');
          const body = pickTextBody(m);
          if (
            typeof waUserId !== 'string' ||
            typeof waMessageId !== 'string' ||
            !body
          )
            continue;
          await handleWhatsAppInboundMessage({
            waUserId,
            waMessageId,
            body,
            raw: {
              entry: isRecord(entry) ? entry : {},
              change: isRecord(ch) ? ch : {},
              message: isRecord(m) ? m : {},
            },
          });
        }
      }
    }

    res.status(200).json({ ok: true });
  };

  return { verify, receive };
}
