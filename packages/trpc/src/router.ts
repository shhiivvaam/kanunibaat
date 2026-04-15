import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { lawyerProfile, user, userProfile } from '@kb/database/schema';
import { syncLawyerMeiliFromDb } from '@kb/search';
import {
  lawyerWaitlistInputSchema,
  submitLawyerWaitlist,
  submitUserWaitlist,
  userWaitlistInputSchema,
} from '@kb/waitlist';

import { protectedProcedure, publicProcedure, router } from './init';
import { allocateLawyerSlug } from './lawyer-slug';
import {
  ensureDefaultUserRole,
  ensureLawyerRole,
  ensureUserProfileRow,
  loadProfileBundle,
} from './profile-service';
import { adminRouter } from './routers/admin';
import { lawyerRouter } from './routers/lawyer';
import { marketplaceRouter } from './routers/marketplace';
import { noticesRouter } from './routers/notices';

const updateProfileInputSchema = z.object({
  displayName: z.string().min(1).max(120).optional(),
  locale: z.string().min(2).max(16).optional(),
  avatarUrl: z.string().url().max(2048).nullable().optional(),
});

const createLawyerDraftInputSchema = z.object({
  barState: z.string().max(64).optional(),
  enrollmentNumber: z.string().max(128).optional(),
});

export const appRouter = router({
  health: publicProcedure.query(() => ({
    ok: true as const,
    service: 'kanunibaat-api',
    ts: new Date().toISOString(),
  })),

  marketplace: marketplaceRouter,
  notices: noticesRouter,

  waitlist: router({
    submitUser: publicProcedure.input(userWaitlistInputSchema).mutation(async ({ ctx, input }) => {
      const result = await submitUserWaitlist(input, ctx.waitlistEnv);
      if (!result.ok) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: result.message,
        });
      }
      return { status: 'success' as const, message: result.message };
    }),

    submitLawyer: publicProcedure.input(lawyerWaitlistInputSchema).mutation(async ({ ctx, input }) => {
      const result = await submitLawyerWaitlist(input, ctx.waitlistEnv);
      if (!result.ok) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: result.message,
        });
      }
      return { status: 'success' as const, message: result.message };
    }),
  }),

  profile: router({
    me: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.authUserId;
      const [u] = await ctx.db.select().from(user).where(eq(user.id, userId)).limit(1);
      if (!u) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });
      }
      await ensureDefaultUserRole(ctx.db, userId);
      await ensureUserProfileRow(ctx.db, userId, u.name);
      const bundle = await loadProfileBundle(ctx.db, userId);
      if (!bundle) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Profile bootstrap failed.' });
      }
      return bundle;
    }),

    update: protectedProcedure.input(updateProfileInputSchema).mutation(async ({ ctx, input }) => {
      const userId = ctx.authUserId;
      const [u] = await ctx.db.select().from(user).where(eq(user.id, userId)).limit(1);
      if (!u) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });
      }
      await ensureDefaultUserRole(ctx.db, userId);
      await ensureUserProfileRow(ctx.db, userId, u.name);

      const patch: Partial<typeof userProfile.$inferInsert> = { updatedAt: new Date() };
      if (input.displayName !== undefined) patch.displayName = input.displayName;
      if (input.locale !== undefined) patch.locale = input.locale;
      if (input.avatarUrl !== undefined) patch.avatarUrl = input.avatarUrl;

      await ctx.db.update(userProfile).set(patch).where(eq(userProfile.userId, userId));

      const bundle = await loadProfileBundle(ctx.db, userId);
      if (!bundle) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Profile load failed.' });
      }
      return bundle;
    }),

    createLawyerDraft: protectedProcedure
      .input(createLawyerDraftInputSchema)
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.authUserId;
        const [u] = await ctx.db.select().from(user).where(eq(user.id, userId)).limit(1);
        if (!u) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' });
        }
        await ensureDefaultUserRole(ctx.db, userId);
        await ensureUserProfileRow(ctx.db, userId, u.name);
        await ensureLawyerRole(ctx.db, userId);

        const [p] = await ctx.db.select().from(userProfile).where(eq(userProfile.userId, userId)).limit(1);
        const [existing] = await ctx.db
          .select()
          .from(lawyerProfile)
          .where(eq(lawyerProfile.userId, userId))
          .limit(1);

        if (existing) {
          const preserveStatus =
            existing.verificationStatus === 'verified' || existing.verificationStatus === 'pending';
          await ctx.db
            .update(lawyerProfile)
            .set({
              barState: input.barState ?? existing.barState,
              enrollmentNumber: input.enrollmentNumber ?? existing.enrollmentNumber,
              verificationStatus: preserveStatus ? existing.verificationStatus : 'draft',
              updatedAt: new Date(),
            })
            .where(eq(lawyerProfile.userId, userId));
          if (preserveStatus && existing.verificationStatus === 'verified') {
            await syncLawyerMeiliFromDb(ctx.db, ctx.meili, ctx.meiliIndexName, userId);
          }
        } else {
          const slug = await allocateLawyerSlug(ctx.db, p?.displayName ?? u.name, userId);
          await ctx.db.insert(lawyerProfile).values({
            userId,
            slug,
            barState: input.barState ?? null,
            enrollmentNumber: input.enrollmentNumber ?? null,
            verificationStatus: 'draft',
          });
        }

        const bundle = await loadProfileBundle(ctx.db, userId);
        if (!bundle) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Profile load failed.' });
        }
        return bundle.lawyer;
      }),
  }),

  admin: adminRouter,

  lawyer: lawyerRouter,
});

export type AppRouter = typeof appRouter;
