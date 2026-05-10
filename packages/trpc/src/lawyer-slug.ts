import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type * as DbSchema from '@jurisly/database/schema';
import { lawyerProfile } from '@jurisly/database/schema';

export function slugifyDisplayName(raw: string): string {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return s.length > 0 ? s : 'lawyer';
}

/**
 * Allocates a unique `lawyer_profile.slug` using the display name plus a deterministic suffix when needed.
 */
export async function allocateLawyerSlug(
  db: PostgresJsDatabase<typeof DbSchema>,
  displayName: string,
  userId: string,
): Promise<string> {
  const base = `${slugifyDisplayName(displayName)}-${userId.slice(0, 8)}`;
  let candidate = base.slice(0, 80);
  let n = 0;
  while (n < 50) {
    const [hit] = await db
      .select({ userId: lawyerProfile.userId })
      .from(lawyerProfile)
      .where(eq(lawyerProfile.slug, candidate))
      .limit(1);
    if (!hit || hit.userId === userId) return candidate;
    n += 1;
    candidate = `${base}-${n}`.slice(0, 80);
  }
  return `${base}-${userId}`.slice(0, 80);
}
