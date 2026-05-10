import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { auditLog } from '@jurisly/database/schema';
import type * as DbSchema from '@jurisly/database/schema';

/**
 * Writes a security-critical action to the audit log.
 *
 * Used for tracking:
 * - Payment capture events
 * - DigiLocker OAuth and document access
 * - Bar Council verification attempts
 * - Admin refund actions
 *
 * @param opts Audit log entry details
 */
export async function writeAuditLog(opts: {
  db: PostgresJsDatabase<typeof DbSchema>;
  userId: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  await opts.db.insert(auditLog).values({
    userId: opts.userId ?? null,
    action: opts.action,
    entityType: opts.entityType ?? null,
    entityId: opts.entityId ?? null,
    metadata: opts.metadata ?? null,
    ipAddress: opts.ipAddress ?? null,
    userAgent: opts.userAgent ?? null,
  });
}
