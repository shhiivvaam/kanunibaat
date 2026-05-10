import type { Application, Request, Response } from 'express';

import { db } from '@jurisly/database';
import { consultation } from '@jurisly/database/schema';
import {
  extractSessionTokenForStreaming,
  resolveUserIdFromSessionToken,
} from '@jurisly/trpc';
import { and, eq, or } from 'drizzle-orm';

import type { ConsultationChatFanout } from './consultation-chat-fanout';

const HEARTBEAT_MS = 25_000;

function sseWrite(res: Response, event: string, data: object) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * Streams `refresh` SSE events when new consultation messages arrive (see chat fan-out).
 */
export function attachConsultationChatSse(
  httpServer: Application,
  opts: { fanout: ConsultationChatFanout },
): void {
  httpServer.get(
    '/sse/consultations/:consultationId/messages',
    async (req: Request, res: Response) => {
      const consultationId =
        typeof req.params.consultationId === 'string'
          ? req.params.consultationId.trim()
          : '';
      if (!consultationId) {
        res.status(400).end();
        return;
      }

      const token = extractSessionTokenForStreaming(req);
      if (!token) {
        res.status(401).end();
        return;
      }

      const userId = await resolveUserIdFromSessionToken(db, token);
      if (!userId) {
        res.status(401).end();
        return;
      }

      const [c] = await db
        .select({ id: consultation.id })
        .from(consultation)
        .where(
          and(
            eq(consultation.id, consultationId),
            or(
              eq(consultation.userId, userId),
              eq(consultation.lawyerUserId, userId),
            ),
          ),
        )
        .limit(1);
      if (!c) {
        res.status(404).end();
        return;
      }

      res.status(200);
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      if (typeof res.flushHeaders === 'function') {
        res.flushHeaders();
      }

      const heartbeat = setInterval(() => {
        res.write(`: ping ${Date.now()}\n\n`);
      }, HEARTBEAT_MS);

      sseWrite(res, 'ready', { consultationId });

      const unsubscribe = opts.fanout.subscribe(consultationId, () => {
        sseWrite(res, 'refresh', { consultationId, ts: Date.now() });
      });

      req.on('close', () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          res.end();
        } catch {
          // ignore
        }
      });
    },
  );
}
