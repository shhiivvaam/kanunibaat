import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type * as DbSchema from '@jurisly/database/schema';
import { lawyerProfile, userProfile } from '@jurisly/database/schema';

import type { MeiliConnection } from './meili-http';
import { deleteLawyerMeili, upsertLawyersMeili } from './meili';

/**
 * Keeps Meilisearch in sync with Postgres for one lawyer. No-op when Meili is not configured.
 * Verified lawyers are upserted; any other status removes the search document.
 */
export async function syncLawyerMeiliFromDb(
  db: PostgresJsDatabase<typeof DbSchema>,
  meili: MeiliConnection | null,
  indexName: string,
  userId: string,
): Promise<void> {
  if (!meili) return;

  const [row] = await db
    .select({
      userId: lawyerProfile.userId,
      slug: lawyerProfile.slug,
      headline: lawyerProfile.headline,
      city: lawyerProfile.city,
      barState: lawyerProfile.barState,
      practiceAreas: lawyerProfile.practiceAreas,
      languages: lawyerProfile.languages,
      yearsExperience: lawyerProfile.yearsExperience,
      verificationStatus: lawyerProfile.verificationStatus,
      displayName: userProfile.displayName,
    })
    .from(lawyerProfile)
    .innerJoin(userProfile, eq(lawyerProfile.userId, userProfile.userId))
    .where(eq(lawyerProfile.userId, userId))
    .limit(1);

  if (row?.verificationStatus !== 'verified') {
    try {
      await deleteLawyerMeili(meili, indexName, userId);
    } catch {
      // Best-effort removal
    }
    return;
  }

  await upsertLawyersMeili(meili, indexName, [
    {
      userId: row.userId,
      slug: row.slug,
      displayName: row.displayName,
      headline: row.headline,
      city: row.city,
      barState: row.barState,
      practiceAreas: Array.isArray(row.practiceAreas) ? row.practiceAreas : [],
      languages: Array.isArray(row.languages) ? row.languages : [],
      yearsExperience: row.yearsExperience,
    },
  ]);
}
