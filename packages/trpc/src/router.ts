import { TRPCError } from '@trpc/server';
import { initTRPC } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { lawyerProfile, user, userProfile } from '@kb/database/schema';
import {
  lawyerWaitlistInputSchema,
  submitLawyerWaitlist,
  submitUserWaitlist,
  userWaitlistInputSchema,
} from '@kb/waitlist';

import type { TrpcContext } from './context';
import {
  ensureDefaultUserRole,
  ensureUserProfileRow,
  loadProfileBundle,
} from './profile-service';

const t = initTRPC.context<TrpcContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

const requireAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.authUserId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not signed in.' });
  }
  return next({
    ctx: {
      ...ctx,
      authUserId: ctx.authUserId,
    },
  });
});

export const protectedProcedure = publicProcedure.use(requireAuth);

export function roleProcedure(role: 'admin' | 'lawyer') {
  return protectedProcedure.use(({ ctx, next }) => {
    if (!ctx.roles.includes(role)) {
      throw new TRPCError({ code: 'FORBIDDEN', message: `Requires role: ${role}` });
    }
    return next({ ctx });
  });
}

const adminProcedure = roleProcedure('admin');
const lawyerProcedure = roleProcedure('lawyer');

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
        const [existing] = await ctx.db
          .select()
          .from(lawyerProfile)
          .where(eq(lawyerProfile.userId, userId))
          .limit(1);

        if (existing) {
          await ctx.db
            .update(lawyerProfile)
            .set({
              barState: input.barState ?? existing.barState,
              enrollmentNumber: input.enrollmentNumber ?? existing.enrollmentNumber,
              verificationStatus: 'draft',
              updatedAt: new Date(),
            })
            .where(eq(lawyerProfile.userId, userId));
        } else {
          await ctx.db.insert(lawyerProfile).values({
            userId,
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

  admin: router({
    pendingLawyers: adminProcedure.query(async ({ ctx }) => {
      const rows = await ctx.db
        .select()
        .from(lawyerProfile)
        .where(eq(lawyerProfile.verificationStatus, 'pending'));
      return { lawyers: rows };
    }),

    listUsers: adminProcedure.query(async ({ ctx }) => {
      const rows = await ctx.db.select({ id: user.id, email: user.email, name: user.name }).from(user).limit(50);
      return { users: rows };
    }),
  }),

  lawyer: router({
    /** Placeholder for future `lawyer.*` subdomain app; proves RBAC wiring. */
    portalStub: lawyerProcedure.query(() => ({
      ok: true as const,
      message: 'Lawyer API surface reserved for a future lawyer host.',
    })),
  }),
});

export type AppRouter = typeof appRouter;
