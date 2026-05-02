import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type * as DbSchema from '@jurisly/database/schema';
import { lawyerProfile, userProfile } from '@jurisly/database/schema';

import type { MarketplaceLawyerHit } from './types';

function escapeIlikePattern(fragment: string): string {
  return fragment.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

/**
 * Verified lawyers only. Empty `rawQuery` returns recent verified profiles (discovery).
 */
export async function searchLawyersPostgres(
  db: PostgresJsDatabase<typeof DbSchema>,
  rawQuery: string,
  limit: number,
): Promise<MarketplaceLawyerHit[]> {
  const q = rawQuery.trim();
  const base = and(eq(lawyerProfile.verificationStatus, 'verified'));

  const searchClause =
    q.length === 0
      ? undefined
      : (() => {
          const term = `%${escapeIlikePattern(q)}%`;
          return or(
            ilike(userProfile.displayName, term),
            ilike(lawyerProfile.headline, term),
            ilike(lawyerProfile.city, term),
            ilike(lawyerProfile.barState, term),
            sql`(${lawyerProfile.practiceAreas})::text ILIKE ${term}`,
            sql`(${lawyerProfile.languages})::text ILIKE ${term}`,
          );
        })();

  const rows = await db
    .select({
      userId: lawyerProfile.userId,
      slug: lawyerProfile.slug,
      displayName: userProfile.displayName,
      headline: lawyerProfile.headline,
      city: lawyerProfile.city,
      barState: lawyerProfile.barState,
      practiceAreas: lawyerProfile.practiceAreas,
      languages: lawyerProfile.languages,
      yearsExperience: lawyerProfile.yearsExperience,
      updatedAt: lawyerProfile.updatedAt,
    })
    .from(lawyerProfile)
    .innerJoin(userProfile, eq(lawyerProfile.userId, userProfile.userId))
    .where(searchClause ? and(base, searchClause) : base)
    .orderBy(desc(lawyerProfile.updatedAt))
    .limit(Math.min(Math.max(limit, 1), 50));

  return rows.map((r) => ({
    userId: r.userId,
    slug: r.slug,
    displayName: r.displayName,
    headline: r.headline,
    city: r.city,
    barState: r.barState,
    practiceAreas: Array.isArray(r.practiceAreas) ? r.practiceAreas : [],
    languages: Array.isArray(r.languages) ? r.languages : [],
    yearsExperience: r.yearsExperience ?? null,
  }));
}
