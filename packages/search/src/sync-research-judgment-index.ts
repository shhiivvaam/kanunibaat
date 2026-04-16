import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type * as DbSchema from '@kb/database/schema';
import { researchJudgment } from '@kb/database/schema';

import type { MeiliConnection } from './meili-http';
import { upsertMeiliDocuments } from './meili-http';

export function researchJudgmentRowToMeiliDocument(row: typeof researchJudgment.$inferSelect): Record<string, unknown> {
  return {
    id: row.id,
    title: row.title,
    court: row.court,
    citation: row.citation,
    summaryExcerpt: row.summaryExcerpt,
    bodyForSearch: row.bodyForSearch,
    topics: row.topics,
    decisionAt: row.decisionAt ? row.decisionAt.toISOString() : null,
  };
}

/** Upserts all `research_judgment` rows into the Meilisearch judgments index (`primaryKey=id`). */
export async function syncResearchJudgmentsToMeili(
  db: PostgresJsDatabase<typeof DbSchema>,
  meili: MeiliConnection,
  indexName: string,
): Promise<{ count: number }> {
  const rows = await db.select().from(researchJudgment);
  const docs = rows.map(researchJudgmentRowToMeiliDocument);
  await upsertMeiliDocuments(meili, indexName, 'id', docs);
  return { count: docs.length };
}
