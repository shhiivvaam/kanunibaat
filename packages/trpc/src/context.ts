import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type * as DbSchema from '@kb/database/schema';
import { userRole } from '@kb/database/schema';
import type { WaitlistEnv } from '@kb/waitlist';

import { extractSessionTokenFromRequest, resolveUserIdFromSessionToken } from './session-resolve';

export type KbRole = (typeof userRole.$inferSelect)['role'];

export interface TrpcContext {
  db: PostgresJsDatabase<typeof DbSchema>;
  authUserId: string | null;
  roles: readonly KbRole[];
  waitlistEnv: WaitlistEnv;
}

export interface TrpcContextDeps {
  db: PostgresJsDatabase<typeof DbSchema>;
  waitlistEnv: WaitlistEnv;
}

async function loadRoles(
  db: PostgresJsDatabase<typeof DbSchema>,
  userId: string,
): Promise<KbRole[]> {
  const rows = await db.select({ role: userRole.role }).from(userRole).where(eq(userRole.userId, userId));
  return rows.map((r) => r.role);
}

/**
 * Factory so Nest can inject DB and env at bootstrap without mutable module state.
 */
export function createTrpcContextFactory(deps: TrpcContextDeps) {
  return async function createTrpcContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
    const token = extractSessionTokenFromRequest(opts.req);
    let authUserId: string | null = null;
    if (token) {
      authUserId = await resolveUserIdFromSessionToken(deps.db, token);
    }
    const roles = authUserId ? await loadRoles(deps.db, authUserId) : [];
    return {
      db: deps.db,
      authUserId,
      roles,
      waitlistEnv: deps.waitlistEnv,
    };
  };
}
