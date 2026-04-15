import { and, eq, inArray, isNotNull } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type * as DbSchema from '@kb/database/schema';
import { lawyerDocument } from '@kb/database/schema';

/** Must be present and fully uploaded before `submitForReview`. */
export const REQUIRED_DOCUMENT_KINDS = ['enrollment_certificate', 'government_id'] as const;

export type RequiredLawyerDocumentKind = (typeof REQUIRED_DOCUMENT_KINDS)[number];

/**
 * Each required kind must have at least one row with `uploaded_at` set (PUT completed).
 */
export async function lawyerHasRequiredDocuments(
  db: PostgresJsDatabase<typeof DbSchema>,
  userId: string,
): Promise<boolean> {
  const rows = await db
    .select({ kind: lawyerDocument.kind })
    .from(lawyerDocument)
    .where(
      and(
        eq(lawyerDocument.userId, userId),
        inArray(lawyerDocument.kind, [...REQUIRED_DOCUMENT_KINDS]),
        isNotNull(lawyerDocument.uploadedAt),
      ),
    );

  const kinds = new Set(rows.map((r) => r.kind));
  return REQUIRED_DOCUMENT_KINDS.every((k) => kinds.has(k));
}
