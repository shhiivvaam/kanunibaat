import crypto from 'node:crypto';
import type { RequestHandler } from 'express';
import { and, eq, lte } from 'drizzle-orm';

import { db, schema } from '@jurisly/database';

import { fetchCourtSnapshotFromBridge } from '../lib/court-bridge-client';

function readInternalSecret(req: {
  header: (name: string) => string | undefined;
}): string | undefined {
  return (
    req.header('x-internal-cron-secret') ??
    req.header('x-cron-secret') ??
    undefined
  );
}

function stableHash(value: unknown): string {
  const s = JSON.stringify(value);
  return crypto.createHash('sha256').update(s).digest('hex');
}

export function createCaseTrackerPollHandler(opts: {
  internalSecret: string;
  njdgBridgeUrl: string | null;
  njdgBridgeSecret: string | null;
}): RequestHandler {
  return async (req, res) => {
    const provided = readInternalSecret(req);
    if (!provided || provided !== opts.internalSecret) {
      res.status(401).json({ ok: false });
      return;
    }

    const bridgeUrl = opts.njdgBridgeUrl?.trim() ?? '';
    const bridgeSecret = opts.njdgBridgeSecret?.trim() ?? '';
    if (!bridgeUrl || !bridgeSecret) {
      res.status(503).json({ ok: false, error: 'njdg_bridge_not_configured' });
      return;
    }

    const now = new Date();
    const rows = await db
      .select()
      .from(schema.caseTracker)
      .where(
        and(
          eq(schema.caseTracker.enabled, true),
          lte(schema.caseTracker.nextCheckAt, now),
        ),
      )
      .orderBy(schema.caseTracker.nextCheckAt)
      .limit(25);

    let updated = 0;
    for (const t of rows) {
      try {
        const snapshot = await fetchCourtSnapshotFromBridge({
          cnr: t.cnr,
          bridgeUrl,
          bridgeSecret,
        });
        const snapshotObj =
          typeof snapshot === 'object' && snapshot !== null
            ? (snapshot as Record<string, unknown>)
            : ({ value: snapshot } as Record<string, unknown>);
        const hash = stableHash(snapshotObj);
        const changed = t.lastSnapshotHash && t.lastSnapshotHash !== hash;
        const nextCheckAt = new Date(now.getTime() + 6 * 60 * 60 * 1000);
        await db
          .update(schema.caseTracker)
          .set({
            lastSnapshotHash: hash,
            lastSnapshotJson: snapshotObj,
            nextCheckAt,
            updatedAt: now,
          })
          .where(eq(schema.caseTracker.id, t.id));

        if (changed) {
          updated += 1;
          const dedupeKey = `case_update:${t.userId}:${t.cnr}:${hash}`;
          await db
            .insert(schema.notificationJob)
            .values({
              userId: t.userId,
              kind: 'case_update',
              dedupeKey,
              scheduledAt: now,
              payloadJson: {
                title: 'Case update',
                body: `CNR ${t.cnr} has a new update.`,
                url: `/case-tracker`,
                mobilePath: `/case-tracker`,
                data: { cnr: t.cnr },
              },
              updatedAt: now,
            })
            .onConflictDoNothing({ target: schema.notificationJob.dedupeKey });
        }
      } catch {
        const nextCheckAt = new Date(now.getTime() + 60 * 60 * 1000);
        await db
          .update(schema.caseTracker)
          .set({ nextCheckAt, updatedAt: now })
          .where(eq(schema.caseTracker.id, t.id));
      }
    }

    res.status(200).json({ ok: true, polled: rows.length, updates: updated });
  };
}
