import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { caseTracker } from '@kb/database/schema';

import { fetchCourtSnapshotViaBridge, normalizeAndValidateCnr } from '../cases/njdg-lookup';
import { computeEntitlementsForUser } from '../billing/entitlements';
import { protectedProcedure, publicProcedure, router } from '../init';

export const caseTrackerRouter = router({
  lookupByCnr: publicProcedure.input(z.object({ cnr: z.string().min(1).max(40) })).query(async ({ ctx, input }) => {
    if (!ctx.njdgBridgeUrl || !ctx.njdgBridgeSecret) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Court status bridge is not configured.',
      });
    }
    try {
      const cnr = normalizeAndValidateCnr(input.cnr);
      const snapshot = await fetchCourtSnapshotViaBridge(ctx.njdgBridgeUrl, ctx.njdgBridgeSecret, cnr);
      return { cnr, snapshot };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Lookup failed.';
      throw new TRPCError({ code: 'BAD_REQUEST', message: msg });
    }
  }),

  track: protectedProcedure.input(z.object({ cnr: z.string().min(1).max(40) })).mutation(async ({ ctx, input }) => {
    const ent = await computeEntitlementsForUser({ db: ctx.db, userId: ctx.authUserId, now: new Date() });
    if (!ent.limits.caseTrackerEnabled) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Case tracker requires a paid plan.' });
    }
    const cnr = normalizeAndValidateCnr(input.cnr);
    const now = new Date();
    await ctx.db
      .insert(caseTracker)
      .values({ userId: ctx.authUserId, cnr, enabled: true, nextCheckAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: [caseTracker.userId, caseTracker.cnr],
        set: { enabled: true, updatedAt: now },
      });
    return { ok: true as const };
  }),

  untrack: protectedProcedure.input(z.object({ cnr: z.string().min(1).max(40) })).mutation(async ({ ctx, input }) => {
    const cnr = normalizeAndValidateCnr(input.cnr);
    const now = new Date();
    await ctx.db
      .update(caseTracker)
      .set({ enabled: false, updatedAt: now })
      .where(and(eq(caseTracker.userId, ctx.authUserId), eq(caseTracker.cnr, cnr)));
    return { ok: true as const };
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(caseTracker).where(eq(caseTracker.userId, ctx.authUserId));
  }),
});

