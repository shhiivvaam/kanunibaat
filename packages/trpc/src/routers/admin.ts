import { TRPCError } from '@trpc/server';
import { asc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';

import { lawyerDocument, lawyerProfile, user, userProfile } from '@jurisly/database/schema';
import { syncLawyerMeiliFromDb, syncResearchJudgmentsToMeili } from '@jurisly/search';

import { adminProcedure, router } from '../init';

const userIdInputSchema = z.object({
  userId: z.string().min(1).max(128),
});

const rejectInputSchema = z.object({
  userId: z.string().min(1).max(128),
  reason: z.string().max(500).optional(),
});

export const adminRouter = router({
  pendingLawyers: adminProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        userId: lawyerProfile.userId,
        slug: lawyerProfile.slug,
        barState: lawyerProfile.barState,
        enrollmentNumber: lawyerProfile.enrollmentNumber,
        verificationStatus: lawyerProfile.verificationStatus,
        headline: lawyerProfile.headline,
        city: lawyerProfile.city,
        updatedAt: lawyerProfile.updatedAt,
        displayName: userProfile.displayName,
        email: user.email,
      })
      .from(lawyerProfile)
      .innerJoin(userProfile, eq(lawyerProfile.userId, userProfile.userId))
      .innerJoin(user, eq(lawyerProfile.userId, user.id))
      .where(eq(lawyerProfile.verificationStatus, 'pending'))
      .orderBy(asc(lawyerProfile.updatedAt));

    const ids = rows.map((r) => r.userId);
    const docs =
      ids.length === 0
        ? []
        : await ctx.db.select().from(lawyerDocument).where(inArray(lawyerDocument.userId, ids));

    const byUser = new Map<string, (typeof docs)[number][]>();
    for (const d of docs) {
      const list = byUser.get(d.userId) ?? [];
      list.push(d);
      byUser.set(d.userId, list);
    }

    return {
      lawyers: rows.map((r) => ({
        ...r,
        documents: (byUser.get(r.userId) ?? []).map((d) => ({
          id: d.id,
          kind: d.kind,
          fileName: d.fileName,
          contentType: d.contentType,
          byteSize: d.byteSize,
          uploadedAt: d.uploadedAt,
        })),
      })),
    };
  }),

  listUsers: adminProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({ id: user.id, email: user.email, name: user.name })
      .from(user)
      .limit(50);
    return { users: rows };
  }),

  approveLawyer: adminProcedure.input(userIdInputSchema).mutation(async ({ ctx, input }) => {
    const [law] = await ctx.db
      .select()
      .from(lawyerProfile)
      .where(eq(lawyerProfile.userId, input.userId))
      .limit(1);
    if (!law) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Lawyer profile not found.' });
    }
    if (law.verificationStatus !== 'pending') {
      throw new TRPCError({ code: 'CONFLICT', message: 'Lawyer is not pending review.' });
    }

    await ctx.db
      .update(lawyerProfile)
      .set({
        verificationStatus: 'verified',
        rejectionReason: null,
        updatedAt: new Date(),
      })
      .where(eq(lawyerProfile.userId, input.userId));

    await syncLawyerMeiliFromDb(ctx.db, ctx.meili, ctx.meiliIndexName, input.userId);
    return { ok: true as const };
  }),

  rejectLawyer: adminProcedure.input(rejectInputSchema).mutation(async ({ ctx, input }) => {
    const [law] = await ctx.db
      .select()
      .from(lawyerProfile)
      .where(eq(lawyerProfile.userId, input.userId))
      .limit(1);
    if (!law) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Lawyer profile not found.' });
    }
    if (law.verificationStatus !== 'pending') {
      throw new TRPCError({ code: 'CONFLICT', message: 'Lawyer is not pending review.' });
    }

    const rejectionNote = input.reason?.trim();
    await ctx.db
      .update(lawyerProfile)
      .set({
        verificationStatus: 'rejected',
        rejectionReason: rejectionNote && rejectionNote.length > 0 ? rejectionNote : null,
        updatedAt: new Date(),
      })
      .where(eq(lawyerProfile.userId, input.userId));

    await syncLawyerMeiliFromDb(ctx.db, ctx.meili, ctx.meiliIndexName, input.userId);
    return { ok: true as const };
  }),

  reindexResearchJudgments: adminProcedure.mutation(async ({ ctx }) => {
    if (!ctx.meili) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Meilisearch is not configured (MEILISEARCH_URL / MEILISEARCH_MASTER_KEY).',
      });
    }
    const { count } = await syncResearchJudgmentsToMeili(
      ctx.db,
      ctx.meili,
      ctx.meiliJudgmentsIndexName,
    );
    return { indexed: count };
  }),
});
