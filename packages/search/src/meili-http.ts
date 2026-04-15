import type { MarketplaceLawyerHit } from './types';

export interface MeiliConnection {
  host: string;
  apiKey: string;
}

function baseUrl(host: string): string {
  return host.replace(/\/$/, '');
}

function authHeaders(apiKey: string): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey.length > 0) h.Authorization = `Bearer ${apiKey}`;
  return h;
}

function hitFromMeiliRecord(record: Record<string, unknown>): MarketplaceLawyerHit | null {
  const userId = record.userId;
  const slug = record.slug;
  if (typeof userId !== 'string' || typeof slug !== 'string') return null;
  return {
    userId,
    slug,
    displayName: typeof record.displayName === 'string' ? record.displayName : null,
    headline: typeof record.headline === 'string' ? record.headline : '',
    city: typeof record.city === 'string' ? record.city : null,
    barState: typeof record.barState === 'string' ? record.barState : null,
    practiceAreas: Array.isArray(record.practiceAreas)
      ? record.practiceAreas.filter((x): x is string => typeof x === 'string')
      : [],
    languages: Array.isArray(record.languages)
      ? record.languages.filter((x): x is string => typeof x === 'string')
      : [],
    yearsExperience: typeof record.yearsExperience === 'number' ? record.yearsExperience : null,
  };
}

export async function searchLawyersMeili(
  conn: MeiliConnection,
  indexName: string,
  query: string,
  limit: number,
): Promise<MarketplaceLawyerHit[]> {
  const url = `${baseUrl(conn.host)}/indexes/${encodeURIComponent(indexName)}/search`;
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(conn.apiKey),
    body: JSON.stringify({ q: query, limit, attributesToRetrieve: ['*'] }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Meilisearch search failed: ${res.status} ${text}`);
  }
  const body = (await res.json()) as { hits?: unknown[] };
  const out: MarketplaceLawyerHit[] = [];
  for (const h of body.hits ?? []) {
    if (h && typeof h === 'object') {
      const mapped = hitFromMeiliRecord(h as Record<string, unknown>);
      if (mapped) out.push(mapped);
    }
  }
  return out;
}

export async function upsertLawyersMeili(
  conn: MeiliConnection,
  indexName: string,
  documents: Record<string, unknown>[],
): Promise<void> {
  if (documents.length === 0) return;
  const url = `${baseUrl(conn.host)}/indexes/${encodeURIComponent(indexName)}/documents?primaryKey=userId`;
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(conn.apiKey),
    body: JSON.stringify(documents),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Meilisearch upsert failed: ${res.status} ${text}`);
  }
}

export async function deleteLawyerMeili(conn: MeiliConnection, indexName: string, userId: string): Promise<void> {
  const url = `${baseUrl(conn.host)}/indexes/${encodeURIComponent(indexName)}/documents/${encodeURIComponent(userId)}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: authHeaders(conn.apiKey),
  });
  if (!res.ok && res.status !== 404) {
    const text = await res.text().catch(() => '');
    throw new Error(`Meilisearch delete failed: ${res.status} ${text}`);
  }
}
