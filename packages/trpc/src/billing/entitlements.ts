import { TRPCError } from '@trpc/server';
import { and, desc, eq, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { z } from 'zod';

import type * as DbSchema from '@kb/database/schema';
import { kbPlan, kbSubscription, kbUsageMeter } from '@kb/database/schema';

export const PLAN_KEYS = ['free', 'pro', 'plus'] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];

const limitsSchema = z.object({
  noticeScansPerMonth: z.number().int().positive().nullable().optional(),
  vaultDocsMax: z.number().int().positive().nullable().optional(),
  vaultStorageBytesMax: z.number().int().positive().nullable().optional(),
  caseTrackerEnabled: z.boolean().optional(),
  aiEnabled: z.boolean().optional(),
  priorityMatching: z.boolean().optional(),
});

export type PlanLimits = z.infer<typeof limitsSchema>;

export interface Entitlements {
  planKey: PlanKey;
  limits: Required<Pick<PlanLimits, 'caseTrackerEnabled' | 'aiEnabled' | 'priorityMatching'>> &
  Pick<PlanLimits, 'noticeScansPerMonth' | 'vaultDocsMax' | 'vaultStorageBytesMax'>;
  usage: {
    noticeScansThisPeriod: number;
    noticeScansRemaining: number | null;
    periodStartAt: Date;
  };
}

const DEFAULT_LIMITS: Record<PlanKey, PlanLimits> = {
  free: {
    noticeScansPerMonth: 2,
    vaultDocsMax: 5,
    vaultStorageBytesMax: 50 * 1024 * 1024,
    caseTrackerEnabled: false,
    aiEnabled: false,
    priorityMatching: false,
  },
  pro: {
    noticeScansPerMonth: null,
    vaultDocsMax: null,
    vaultStorageBytesMax: 5 * 1024 * 1024 * 1024,
    caseTrackerEnabled: true,
    aiEnabled: true,
    priorityMatching: true,
  },
  plus: {
    noticeScansPerMonth: null,
    vaultDocsMax: null,
    vaultStorageBytesMax: 5 * 1024 * 1024 * 1024,
    caseTrackerEnabled: true,
    aiEnabled: true,
    priorityMatching: true,
  },
};

export function monthStartUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0));
}

export async function ensureDefaultPlans(db: PostgresJsDatabase<typeof DbSchema>): Promise<void> {
  const now = new Date();
  await db
    .insert(kbPlan)
    .values(
      PLAN_KEYS.map((key) => ({
        key,
        name: key === 'free' ? 'Naagrik Free' : key === 'pro' ? 'Naagrik Pro' : 'Naagrik Plus',
        priceInr: key === 'free' ? 0 : key === 'pro' ? 199 : 999,
        period: 'month' as const,
        limitsJson: DEFAULT_LIMITS[key] as unknown as Record<string, unknown>,
        updatedAt: now,
      })),
    )
    .onConflictDoUpdate({
      target: kbPlan.key,
      set: { updatedAt: now },
    });
}

async function loadPlanByKey(
  db: PostgresJsDatabase<typeof DbSchema>,
  key: PlanKey,
): Promise<(typeof kbPlan.$inferSelect) | null> {
  const [row] = await db.select().from(kbPlan).where(eq(kbPlan.key, key)).limit(1);
  return row ?? null;
}

async function loadEffectivePlanKeyForUser(
  db: PostgresJsDatabase<typeof DbSchema>,
  userId: string,
): Promise<PlanKey> {
  const [sub] = await db
    .select({ planKey: kbPlan.key, status: kbSubscription.status })
    .from(kbSubscription)
    .innerJoin(kbPlan, eq(kbSubscription.planId, kbPlan.id))
    .where(eq(kbSubscription.userId, userId))
    .orderBy(desc(kbSubscription.createdAt))
    .limit(1);

  if (sub?.status === 'active' || sub?.status === 'past_due' || sub?.status === 'paused') {
    const key = sub.planKey;
    if (PLAN_KEYS.includes(key as PlanKey)) return key as PlanKey;
  }
  return 'free';
}

async function loadUsageCount(
  db: PostgresJsDatabase<typeof DbSchema>,
  userId: string,
  meterKey: string,
  periodStartAt: Date,
): Promise<number> {
  const [row] = await db
    .select({ count: kbUsageMeter.count })
    .from(kbUsageMeter)
    .where(and(eq(kbUsageMeter.userId, userId), eq(kbUsageMeter.meterKey, meterKey), eq(kbUsageMeter.periodStartAt, periodStartAt)))
    .limit(1);
  return row?.count ?? 0;
}

export async function computeEntitlementsForUser(opts: {
  db: PostgresJsDatabase<typeof DbSchema>;
  userId: string;
  now: Date;
}): Promise<Entitlements> {
  let planKey: PlanKey = 'free';
  let plan: (typeof kbPlan.$inferSelect) | null = null;
  try {
    await ensureDefaultPlans(opts.db);
    planKey = await loadEffectivePlanKeyForUser(opts.db, opts.userId);
    plan = await loadPlanByKey(opts.db, planKey);
  } catch {
    // In tests or misconfigured environments, default to free entitlements.
    planKey = 'free';
    plan = null;
  }

  const parsed = limitsSchema.safeParse(plan?.limitsJson ?? DEFAULT_LIMITS[planKey]);
  const limitsRaw = parsed.success ? parsed.data : DEFAULT_LIMITS[planKey];
  const limits = {
    noticeScansPerMonth: limitsRaw.noticeScansPerMonth ?? DEFAULT_LIMITS[planKey].noticeScansPerMonth ?? null,
    vaultDocsMax: limitsRaw.vaultDocsMax ?? DEFAULT_LIMITS[planKey].vaultDocsMax ?? null,
    vaultStorageBytesMax: limitsRaw.vaultStorageBytesMax ?? DEFAULT_LIMITS[planKey].vaultStorageBytesMax ?? null,
    caseTrackerEnabled: limitsRaw.caseTrackerEnabled ?? DEFAULT_LIMITS[planKey].caseTrackerEnabled ?? false,
    aiEnabled: limitsRaw.aiEnabled ?? DEFAULT_LIMITS[planKey].aiEnabled ?? false,
    priorityMatching: limitsRaw.priorityMatching ?? DEFAULT_LIMITS[planKey].priorityMatching ?? false,
  };

  const periodStartAt = monthStartUtc(opts.now);
  let noticeScansThisPeriod = 0;
  try {
    noticeScansThisPeriod = await loadUsageCount(opts.db, opts.userId, 'notice_scans', periodStartAt);
  } catch {
    noticeScansThisPeriod = 0;
  }
  const noticeScansRemaining =
    limits.noticeScansPerMonth == null ? null : Math.max(0, limits.noticeScansPerMonth - noticeScansThisPeriod);

  return {
    planKey,
    limits,
    usage: { noticeScansThisPeriod, noticeScansRemaining, periodStartAt },
  };
}

export async function incrementUsageMeter(opts: {
  db: PostgresJsDatabase<typeof DbSchema>;
  userId: string;
  meterKey: string;
  periodStartAt: Date;
  by?: number;
}): Promise<void> {
  const now = new Date();
  const inc = opts.by ?? 1;
  await opts.db
    .insert(kbUsageMeter)
    .values({
      userId: opts.userId,
      meterKey: opts.meterKey,
      periodStartAt: opts.periodStartAt,
      count: inc,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [kbUsageMeter.userId, kbUsageMeter.meterKey, kbUsageMeter.periodStartAt],
      set: { count: sql`${kbUsageMeter.count} + ${inc}`, updatedAt: now },
    });
}

export function assertEntitlement(opts: { ok: boolean; message: string }) {
  if (!opts.ok) throw new TRPCError({ code: 'FORBIDDEN', message: opts.message });
}

