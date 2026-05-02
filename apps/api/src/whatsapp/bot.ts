import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';

import { db, schema } from '@jurisly/database';

import { sendWhatsAppText } from './cloud-api';

type InboundMessage = {
  waUserId: string;
  waMessageId: string;
  body: string;
  raw: Record<string, unknown>;
};

type BotEnv = {
  apiToken: string;
  phoneNumberId: string;
  webBaseUrl: string;
};

function normalizeText(s: string): string {
  return s.trim().replace(/\s+/g, ' ');
}

function computeWebBaseUrl(): string {
  const fromAuth = process.env.BETTER_AUTH_URL?.trim();
  if (fromAuth) return fromAuth.replace(/\/$/, '');
  const fromPublic = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromPublic) return fromPublic.replace(/\/$/, '');
  return 'http://localhost:3000';
}

function link(opts: { base: string; locale: string; path: string }): string {
  // Generate locale-prefixed web URLs
  // These URLs will automatically open the mobile app when universal links are configured
  // (see apps/mobile/app.json and docs/MOBILE-AUTH-DEEPLINKS.md)
  // If the app is not installed, they open the web version
  const base = opts.base.replace(/\/$/, '');
  const path = opts.path.startsWith('/') ? opts.path : `/${opts.path}`;
  return `${base}/${encodeURIComponent(opts.locale)}${path}`;
}

function menu(locale: string): string {
  if (locale === 'hi') {
    return [
      'आप क्या करना चाहते हैं?',
      '1) Notice Scanner',
      '2) Kya Karein? (Emergency Guide)',
      '3) Lawyer Connect',
      '',
      'उत्तर: 1 / 2 / 3',
    ].join('\n');
  }
  return [
    'What would you like to do?',
    '1) Notice Scanner',
    '2) Kya Karein? (Emergency Guide)',
    '3) Lawyer Connect',
    '',
    'Reply with: 1 / 2 / 3',
  ].join('\n');
}

function localePrompt(): string {
  return [
    'Welcome to Jurisly.',
    'Reply with your language:',
    'en = English',
    'hi = हिन्दी',
    '',
    '(More languages coming.)',
  ].join('\n');
}

export async function handleWhatsAppInboundMessage(
  msg: InboundMessage,
): Promise<void> {
  const apiToken = process.env.WHATSAPP_API_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (!apiToken || !phoneNumberId) return;

  const env: BotEnv = {
    apiToken,
    phoneNumberId,
    webBaseUrl: computeWebBaseUrl(),
  };

  // Idempotency: if we've already stored this WhatsApp message id, do nothing.
  const existing = await db
    .select({ id: schema.whatsappMessage.id })
    .from(schema.whatsappMessage)
    .where(eq(schema.whatsappMessage.waMessageId, msg.waMessageId))
    .limit(1);
  if (existing.length > 0) return;

  const now = new Date();
  const convoRows = await db
    .select()
    .from(schema.whatsappConversation)
    .where(eq(schema.whatsappConversation.waUserId, msg.waUserId))
    .limit(1);
  const convo =
    convoRows[0] ??
    (
      await db
        .insert(schema.whatsappConversation)
        .values({
          waUserId: msg.waUserId,
          lastState: 'entry',
          lastLocale: 'en',
          lastSeenAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .returning()
    )[0];

  await db.insert(schema.whatsappMessage).values({
    conversationId: convo.id,
    waMessageId: msg.waMessageId,
    direction: 'in',
    body: msg.body,
    rawJson: msg.raw,
    createdAt: now,
  });

  const text = normalizeText(msg.body).toLowerCase();
  let nextLocale = convo.lastLocale ?? 'en';
  let nextState = convo.lastState ?? 'entry';
  let reply: string | null = null;

  if (nextState === 'entry') {
    if (text === 'hi' || text === 'hindi' || text.includes('ह')) {
      nextLocale = 'hi';
      nextState = 'menu';
      reply = menu(nextLocale);
    } else if (text === 'en' || text === 'english') {
      nextLocale = 'en';
      nextState = 'menu';
      reply = menu(nextLocale);
    } else {
      reply = localePrompt();
    }
  } else if (text === 'menu' || text === '0' || text === 'start') {
    nextState = 'menu';
    reply = menu(nextLocale);
  } else if (nextState === 'menu') {
    if (text === '1' || text.includes('notice')) {
      nextState = 'menu';
      const url = link({
        base: env.webBaseUrl,
        locale: nextLocale,
        path: '/notice-scanner',
      });
      reply =
        nextLocale === 'hi'
          ? `Notice Scanner खोलें: ${url}\n\nयदि आप चाहें तो notice का text यहीं paste करें।`
          : `Open Notice Scanner: ${url}\n\nIf you want, you can also paste the notice text here.`;
    } else if (
      text === '2' ||
      text.includes('kya') ||
      text.includes('guide') ||
      text.includes('emergency')
    ) {
      nextState = 'menu';
      const url = link({
        base: env.webBaseUrl,
        locale: nextLocale,
        path: '/kya-karein',
      });
      reply =
        nextLocale === 'hi'
          ? `Emergency Guide: ${url}\n\nबताइए: आपकी स्थिति क्या है? (उदा: arrest, accident, legal notice)`
          : `Emergency Guide: ${url}\n\nTell me your situation (e.g. arrest, accident, legal notice).`;
    } else if (
      text === '3' ||
      text.includes('lawyer') ||
      text.includes('vakil')
    ) {
      nextState = 'menu';
      const url = link({
        base: env.webBaseUrl,
        locale: nextLocale,
        path: '/lawyers',
      });
      reply =
        nextLocale === 'hi'
          ? `Verified lawyers देखें: ${url}\n\nयदि आप चाहें तो अपना शहर लिखें (उदा: Delhi, Mumbai) ताकि मैं सही link भेज सकूं।`
          : `Browse verified lawyers: ${url}\n\nOptionally reply with your city (e.g. Delhi, Mumbai) for a filtered link.`;
    } else if (text.length > 0) {
      // Treat free text on menu as a lightweight shortcut (city hint, etc.)
      const url = link({
        base: env.webBaseUrl,
        locale: nextLocale,
        path: `/lawyers?city=${encodeURIComponent(msg.body.trim())}`,
      });
      reply =
        nextLocale === 'hi'
          ? `आपके शहर के वकील: ${url}\n\nया menu के लिए 0 लिखें।`
          : `Lawyers in your city: ${url}\n\nOr reply 0 for menu.`;
    }
  }

  if (!reply) return;

  const send = await sendWhatsAppText({
    apiToken: env.apiToken,
    phoneNumberId: env.phoneNumberId,
    toWaUserId: msg.waUserId,
    body: reply,
  });

  await db
    .update(schema.whatsappConversation)
    .set({
      lastLocale: nextLocale,
      lastState: nextState,
      lastSeenAt: now,
      updatedAt: now,
    })
    .where(eq(schema.whatsappConversation.id, convo.id));

  if (send.ok) {
    await db.insert(schema.whatsappMessage).values({
      conversationId: convo.id,
      waMessageId: send.messageId,
      direction: 'out',
      body: reply,
      rawJson: { send },
      createdAt: new Date(),
    });
  } else {
    await db.insert(schema.whatsappMessage).values({
      conversationId: convo.id,
      waMessageId: `out-${randomUUID()}`,
      direction: 'out',
      body: reply,
      rawJson: { send },
      createdAt: new Date(),
    });
  }
}
