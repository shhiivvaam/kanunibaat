import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as DbSchema from '@jurisly/database/schema';
import { userRole } from '@jurisly/database/schema';
import type { MeiliConnection } from '@jurisly/search';
import type { S3DocumentsConfig } from '@jurisly/storage';
import type { WaitlistEnv } from '@jurisly/waitlist';

import { extractSessionTokenFromRequest, resolveUserIdFromSessionToken } from './session-resolve';
import type { TrpcStructuredLogger } from './lib/trpc-structured-logger';
import { noopStructuredLogger } from './lib/trpc-structured-logger';

export type KbRole = (typeof userRole.$inferSelect)['role'];

export interface TrpcContext {
  db: PostgresJsDatabase<typeof DbSchema>;
  authUserId: string | null;
  roles: readonly KbRole[];
  /** Echo of `x-request-id` / `x-correlation-id` when present (log correlation). */
  correlationId: string | null;
  logger: TrpcStructuredLogger;
  /** Optional fan-out when consultation chat messages are inserted (SSE subscribers). */
  notifyConsultationChatSubscribers?: (consultationId: string) => void;
  waitlistEnv: WaitlistEnv;
  meili: MeiliConnection | null;
  meiliIndexName: string;
  meiliJudgmentsIndexName: string;
  s3Documents: S3DocumentsConfig | null;
  requestIp: string | null;
  userAgent: string | null;
  googleVisionApiKey: string | null;
  openaiApiKey: string | null;
  razorpayKeyId: string | null;
  razorpayKeySecret: string | null;
  livekitUrl: string | null;
  livekitApiKey: string | null;
  livekitApiSecret: string | null;
  /** Optional HTTPS bridge that returns NJDG/eCourts JSON for a CNR (server-controlled). */
  njdgBridgeUrl: string | null;
  njdgBridgeSecret: string | null;
}

export interface TrpcContextDeps {
  db: PostgresJsDatabase<typeof DbSchema>;
  logger?: TrpcStructuredLogger;
  notifyConsultationChatSubscribers?: (consultationId: string) => void;
  waitlistEnv: WaitlistEnv;
  meili: MeiliConnection | null;
  meiliIndexName: string;
  meiliJudgmentsIndexName: string;
  s3Documents: S3DocumentsConfig | null;
  googleVisionApiKey: string | null;
  openaiApiKey: string | null;
  razorpayKeyId: string | null;
  razorpayKeySecret: string | null;
  livekitUrl: string | null;
  livekitApiKey: string | null;
  livekitApiSecret: string | null;
  njdgBridgeUrl: string | null;
  njdgBridgeSecret: string | null;
}

async function loadRoles(
  db: PostgresJsDatabase<typeof DbSchema>,
  userId: string,
): Promise<KbRole[]> {
  const rows = await db
    .select({ role: userRole.role })
    .from(userRole)
    .where(eq(userRole.userId, userId));
  return rows.map((r) => r.role);
}

/**
 * Factory so Nest can inject DB and env at bootstrap without mutable module state.
 *
 * **Auth**: {@link extractSessionTokenFromRequest} accepts `Authorization: Bearer` (mobile) and Better
 * Auth cookies (browser → Next `/api/trpc` proxy forwards `Cookie`). Both resolve to `authUserId` the
 * same way — see `apps/api/src/session-token.spec.ts` for Bearer vs cookie coverage.
 */
export function createTrpcContextFactory(deps: TrpcContextDeps) {
  return async function createTrpcContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
    const token = extractSessionTokenFromRequest(opts.req);
    let authUserId: string | null = null;
    if (token) {
      authUserId = await resolveUserIdFromSessionToken(deps.db, token);
    }
    const roles = authUserId ? await loadRoles(deps.db, authUserId) : [];
    const forwarded = opts.req.headers['x-forwarded-for'];
    const requestIp =
      typeof forwarded === 'string'
        ? (forwarded.split(',')[0]?.trim() ?? null)
        : Array.isArray(forwarded)
          ? (forwarded[0]?.trim() ?? null)
          : (opts.req.socket?.remoteAddress ?? null);
    const userAgent =
      typeof opts.req.headers['user-agent'] === 'string' ? opts.req.headers['user-agent'] : null;
    const rid = opts.req.headers['x-request-id'] ?? opts.req.headers['x-correlation-id'];
    const correlationId =
      typeof rid === 'string' && rid.length > 0 && rid.length <= 256 ? rid : null;
    return {
      db: deps.db,
      authUserId,
      roles,
      correlationId,
      logger: deps.logger ?? noopStructuredLogger,
      notifyConsultationChatSubscribers: deps.notifyConsultationChatSubscribers,
      waitlistEnv: deps.waitlistEnv,
      meili: deps.meili,
      meiliIndexName: deps.meiliIndexName,
      meiliJudgmentsIndexName: deps.meiliJudgmentsIndexName,
      s3Documents: deps.s3Documents,
      requestIp,
      userAgent,
      googleVisionApiKey: deps.googleVisionApiKey,
      openaiApiKey: deps.openaiApiKey,
      razorpayKeyId: deps.razorpayKeyId,
      razorpayKeySecret: deps.razorpayKeySecret,
      livekitUrl: deps.livekitUrl,
      livekitApiKey: deps.livekitApiKey,
      livekitApiSecret: deps.livekitApiSecret,
      njdgBridgeUrl: deps.njdgBridgeUrl,
      njdgBridgeSecret: deps.njdgBridgeSecret,
    };
  };
}
