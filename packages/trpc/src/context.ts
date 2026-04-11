import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type * as DbSchema from '@kb/database/schema';
import type { WaitlistEnv } from '@kb/waitlist';

export type TrpcContext = {
  db: PostgresJsDatabase<typeof DbSchema>;
  /** Set when a valid Bearer session is present (Phase 2+). */
  authUserId: string | null;
  waitlistEnv: WaitlistEnv;
};

export type TrpcContextDeps = {
  db: PostgresJsDatabase<typeof DbSchema>;
  waitlistEnv: WaitlistEnv;
};

function resolveAuthUserId(req: CreateExpressContextOptions['req']): string | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  // Phase 2: verify JWT / session and return subject. Intentionally inert for now.
  return null;
}

/**
 * Factory so Nest can inject DB and env at bootstrap without mutable module state.
 */
export function createTrpcContextFactory(deps: TrpcContextDeps) {
  return function createTrpcContext(opts: CreateExpressContextOptions): TrpcContext {
    return {
      db: deps.db,
      authUserId: resolveAuthUserId(opts.req),
      waitlistEnv: deps.waitlistEnv,
    };
  };
}
