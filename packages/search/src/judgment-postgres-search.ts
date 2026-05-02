import { desc, ilike, or } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type * as DbSchema from '@jurisly/database/schema';
import { researchJudgment } from '@jurisly/database/schema';

import type { JudgmentSearchHit } from './judgment-types';

function escapeLikePattern(s: string): string {
  return s.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
}

function rowToHit(row: typeof researchJudgment.$inferSelect): JudgmentSearchHit {
  return {
    id: row.id,
    title: row.title,
    court: row.court,
    citation: row.citation,
    decisionAt: row.decisionAt ? row.decisionAt.toISOString() : null,
    summaryExcerpt: row.summaryExcerpt,
    topics: Array.isArray(row.topics) ? row.topics : [],
  };
}

export async function searchJudgmentsPostgres(
  db: PostgresJsDatabase<typeof DbSchema>,
  query: string,
  limit: number,
): Promise<JudgmentSearchHit[]> {
  const q = query.trim();
  if (q.length === 0) {
    const rows = await db
      .select()
      .from(researchJudgment)
      .orderBy(desc(researchJudgment.updatedAt))
      .limit(limit);
    return rows.map(rowToHit);
  }
  const term = `%${escapeLikePattern(q)}%`;
  const rows = await db
    .select()
    .from(researchJudgment)
    .where(
      or(
        ilike(researchJudgment.title, term),
        ilike(researchJudgment.citation, term),
        ilike(researchJudgment.summaryExcerpt, term),
        ilike(researchJudgment.bodyForSearch, term),
      ),
    )
    .orderBy(desc(researchJudgment.updatedAt))
    .limit(limit);
  return rows.map(rowToHit);
}
