import type { MeiliConnection } from './meili-http';
import { searchMeiliRaw } from './meili-http';
import type { JudgmentSearchHit } from './judgment-types';

function hitFromMeiliJudgment(record: Record<string, unknown>): JudgmentSearchHit | null {
  const id = record.id;
  const title = record.title;
  const court = record.court;
  const citation = record.citation;
  if (typeof id !== 'string' || typeof title !== 'string' || typeof court !== 'string' || typeof citation !== 'string') {
    return null;
  }
  const decisionAt =
    typeof record.decisionAt === 'string'
      ? record.decisionAt
      : record.decisionAt === null
        ? null
        : typeof record.decisionAt === 'number'
          ? new Date(record.decisionAt * 1000).toISOString()
          : null;
  return {
    id,
    title,
    court,
    citation,
    decisionAt,
    summaryExcerpt: typeof record.summaryExcerpt === 'string' ? record.summaryExcerpt : '',
    topics: Array.isArray(record.topics) ? record.topics.filter((x): x is string => typeof x === 'string') : [],
  };
}

export async function searchJudgmentsMeili(
  conn: MeiliConnection,
  indexName: string,
  query: string,
  limit: number,
): Promise<JudgmentSearchHit[]> {
  const raw = await searchMeiliRaw(conn, indexName, query, limit);
  const out: JudgmentSearchHit[] = [];
  for (const r of raw) {
    const m = hitFromMeiliJudgment(r);
    if (m) out.push(m);
  }
  return out;
}
