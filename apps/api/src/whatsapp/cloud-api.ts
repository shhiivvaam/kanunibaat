import { fetchWithTimeout } from '../lib/outbound-fetch';

export type WhatsAppSendTextResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

export async function sendWhatsAppText(opts: {
  apiToken: string;
  phoneNumberId: string;
  toWaUserId: string;
  body: string;
}): Promise<WhatsAppSendTextResult> {
  const url = `https://graph.facebook.com/v20.0/${encodeURIComponent(opts.phoneNumberId)}/messages`;

  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: opts.toWaUserId,
      type: 'text',
      text: { body: opts.body },
    }),
  });

  const json = (await res.json().catch(() => null)) as {
    messages?: { id?: string }[];
    error?: { message?: string };
  } | null;

  if (!res.ok) {
    return {
      ok: false,
      error: json?.error?.message ?? `WhatsApp send failed (${res.status})`,
    };
  }

  const messageId = json?.messages?.[0]?.id;
  if (!messageId)
    return { ok: false, error: 'WhatsApp send failed (missing message id)' };
  return { ok: true, messageId };
}
