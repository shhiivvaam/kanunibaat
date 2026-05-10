import type { MeiliConnection } from './meili-http';
import type { MarketplaceLawyerHit } from './types';
import {
  deleteLawyerMeili as deleteHttp,
  searchLawyersMeili as searchHttp,
  upsertLawyersMeili as upsertHttp,
} from './meili-http';

export type { MeiliConnection } from './meili-http';

export const DEFAULT_LAWYERS_INDEX = 'lawyers';

export const DEFAULT_JUDGMENTS_INDEX = 'judgments';

export function parseMeiliConfigFromEnv(env: NodeJS.ProcessEnv): MeiliConnection | null {
  const host = env.MEILISEARCH_URL?.trim();
  const apiKey = env.MEILISEARCH_MASTER_KEY?.trim() ?? '';
  if (!host) return null;
  return { host, apiKey };
}

export async function searchLawyersMeili(
  conn: MeiliConnection,
  indexName: string,
  query: string,
  limit: number,
): Promise<MarketplaceLawyerHit[]> {
  return searchHttp(conn, indexName, query, limit);
}

export async function upsertLawyersMeili(
  conn: MeiliConnection,
  indexName: string,
  documents: Record<string, unknown>[],
): Promise<void> {
  return upsertHttp(conn, indexName, documents);
}

export async function deleteLawyerMeili(
  conn: MeiliConnection,
  indexName: string,
  userId: string,
): Promise<void> {
  return deleteHttp(conn, indexName, userId);
}
