import type { RequestHandler } from 'express';
import webPush from 'web-push';
import { and, eq, inArray, lte } from 'drizzle-orm';

import { db, schema } from '@kb/database';

type DispatchResult = {
  ok: boolean;
  processed: number;
  sent: number;
  failed: number;
};

function readInternalSecret(req: {
  header: (name: string) => string | undefined;
}): string | undefined {
  return (
    req.header('x-internal-cron-secret') ??
    req.header('x-cron-secret') ??
    undefined
  );
}

function configureWebPushFromEnv(): boolean {
  const pub = process.env.VAPID_PUBLIC_KEY?.trim();
  const priv = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim();
  if (!pub || !priv || !subject) return false;
  webPush.setVapidDetails(subject, pub, priv);
  return true;
}

type PushPayload = {
  title?: string;
  body?: string;
  url?: string;
  data?: Record<string, unknown>;
};

async function sendExpoPush(opts: {
  token: string;
  payload: PushPayload;
}): Promise<boolean> {
  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify([
      {
        to: opts.token,
        title: opts.payload.title,
        body: opts.payload.body,
        data: { ...(opts.payload.data ?? {}), url: opts.payload.url },
      },
    ]),
  });
  if (!res.ok) return false;
  const json = (await res.json().catch(() => null)) as {
    data?: { status?: string }[];
    errors?: unknown[];
  } | null;
  const status = json?.data?.[0]?.status;
  return status === 'ok';
}

async function sendWebPush(opts: {
  endpoint: string;
  p256dh: string;
  auth: string;
  payload: PushPayload;
  webPushEnabled: boolean;
}): Promise<boolean> {
  if (!opts.webPushEnabled) return false;
  try {
    await webPush.sendNotification(
      {
        endpoint: opts.endpoint,
        keys: { p256dh: opts.p256dh, auth: opts.auth },
      },
      JSON.stringify(opts.payload),
    );
    return true;
  } catch {
    return false;
  }
}

export function createNotificationsDispatchHandler(opts: {
  internalSecret: string;
}): RequestHandler {
  const webPushEnabled = configureWebPushFromEnv();

  return async (req, res) => {
    const provided = readInternalSecret(req);
    if (!provided || provided !== opts.internalSecret) {
      res.status(401).json({ ok: false });
      return;
    }

    const now = new Date();
    const due = await db
      .select()
      .from(schema.notificationJob)
      .where(
        and(
          eq(schema.notificationJob.status, 'pending'),
          lte(schema.notificationJob.scheduledAt, now),
        ),
      )
      .orderBy(schema.notificationJob.scheduledAt)
      .limit(100);

    if (due.length === 0) {
      const out: DispatchResult = {
        ok: true,
        processed: 0,
        sent: 0,
        failed: 0,
      };
      res.status(200).json(out);
      return;
    }

    const userIds = [...new Set(due.map((j) => j.userId))];
    const destinations = await db
      .select()
      .from(schema.pushDestination)
      .where(
        and(
          inArray(schema.pushDestination.userId, userIds),
          eq(schema.pushDestination.enabled, true),
        ),
      );

    const destByUser = new Map<string, typeof destinations>();
    for (const d of destinations) {
      if (!d.userId) continue;
      const list = destByUser.get(d.userId) ?? [];
      list.push(d);
      destByUser.set(d.userId, list);
    }

    let sent = 0;
    let failed = 0;

    for (const job of due) {
      const payload = (job.payloadJson ?? {}) as PushPayload;
      const userDests = destByUser.get(job.userId) ?? [];
      let anyOk = false;

      for (const d of userDests) {
        if (d.platform === 'expo' && d.expoPushToken) {
          anyOk =
            (await sendExpoPush({ token: d.expoPushToken, payload })) || anyOk;
        } else if (
          d.platform === 'webpush' &&
          d.webpushEndpoint &&
          d.webpushP256dh &&
          d.webpushAuth
        ) {
          anyOk =
            (await sendWebPush({
              endpoint: d.webpushEndpoint,
              p256dh: d.webpushP256dh,
              auth: d.webpushAuth,
              payload,
              webPushEnabled,
            })) || anyOk;
        }
      }

      const updatedAt = new Date();
      if (anyOk) {
        sent += 1;
        await db
          .update(schema.notificationJob)
          .set({ status: 'sent', sentAt: updatedAt, updatedAt })
          .where(
            and(
              eq(schema.notificationJob.id, job.id),
              eq(schema.notificationJob.status, 'pending'),
            ),
          );
      } else {
        failed += 1;
        await db
          .update(schema.notificationJob)
          .set({ status: 'failed', updatedAt })
          .where(
            and(
              eq(schema.notificationJob.id, job.id),
              eq(schema.notificationJob.status, 'pending'),
            ),
          );
      }
    }

    const out: DispatchResult = {
      ok: true,
      processed: due.length,
      sent,
      failed,
    };
    res.status(200).json(out);
  };
}
