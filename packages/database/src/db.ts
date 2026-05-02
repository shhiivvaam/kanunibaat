import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

/**
 * Resolves the Postgres connection string.
 * Allows `next build` / CI without a real DB process by defaulting in non-production only.
 */
function resolveDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (url) return url;
  // Hosted deploys must set DATABASE_URL. Otherwise allow a dev fallback (local/CI) even when NODE_ENV is production.
  if (process.env.VERCEL === '1' || process.env.RAILWAY_ENVIRONMENT === 'production') {
    throw new Error('DATABASE_URL is required in this hosted environment.');
  }
  return 'postgresql://postgres:postgres@127.0.0.1:5432/jurisly';
}

const globalForDb = globalThis as unknown as {
  jurislySql?: ReturnType<typeof postgres>;
};

/**
 * Single connection per server process. For Next.js dev HMR, reuse the same client.
 * In production (Vercel/serverless), use Supabase pooler + `max: 1` (or a pooler-aware driver).
 */
const sql =
  globalForDb.jurislySql ??
  postgres(resolveDatabaseUrl(), {
    max: 1,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.jurislySql = sql;
}

export const db = drizzle(sql, { schema });
