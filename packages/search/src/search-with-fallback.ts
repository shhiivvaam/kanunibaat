import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type * as DbSchema from '@jurisly/database/schema';

import type { MeiliConnection } from './meili-http';
import { searchLawyersMeili } from './meili';
import { searchLawyersPostgres } from './postgres-search';
import type { MarketplaceLawyerHit } from './types';

export type LawyerSearchSource = 'meilisearch' | 'postgres';

export async function searchLawyersWithFallback(
  db: PostgresJsDatabase<typeof DbSchema>,
  meili: MeiliConnection | null,
  indexName: string,
  query: string,
  limit: number,
): Promise<{ hits: MarketplaceLawyerHit[]; source: LawyerSearchSource }> {
  if (meili) {
    try {
      const hits = await searchLawyersMeili(meili, indexName, query, limit);
      return { hits, source: 'meilisearch' };
    } catch {
      // Index missing, network errors, bad config — Postgres remains authoritative.
    }
  }

  const hits = await searchLawyersPostgres(db, query, limit);
  return { hits, source: 'postgres' };
}
