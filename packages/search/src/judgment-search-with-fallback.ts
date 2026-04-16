import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type * as DbSchema from '@kb/database/schema';

import type { MeiliConnection } from './meili-http';
import { searchJudgmentsMeili } from './judgment-meili';
import { searchJudgmentsPostgres } from './judgment-postgres-search';
import type { JudgmentSearchHit, JudgmentSearchSource } from './judgment-types';

export async function searchJudgmentsWithFallback(
  db: PostgresJsDatabase<typeof DbSchema>,
  meili: MeiliConnection | null,
  indexName: string,
  query: string,
  limit: number,
): Promise<{ hits: JudgmentSearchHit[]; source: JudgmentSearchSource }> {
  if (meili) {
    try {
      const hits = await searchJudgmentsMeili(meili, indexName, query, limit);
      return { hits, source: 'meilisearch' };
    } catch {
      // Index missing, network errors — Postgres remains authoritative.
    }
  }

  const hits = await searchJudgmentsPostgres(db, query, limit);
  return { hits, source: 'postgres' };
}
