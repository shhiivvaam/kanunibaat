import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { notificationJob, pushDestination } from '@jurisly/database/schema';

import { protectedProcedure, router } from '../init';

const expoTokenSchema = z
  .string()
  .min(10)
  .max(512)
  .refine((t) => t.startsWith('ExponentPushToken[') || t.startsWith('ExpoPushToken['), {
    message: 'Invalid Expo token.',
  });

const webPushSubscriptionSchema = z.object({
  endpoint: z.string().url().max(4096),
  p256dh: z.string().min(1).max(1024),
  auth: z.string().min(1).max(1024),
});

export const notificationsRouter = router({
  registerExpoToken: protectedProcedure
    .input(z.object({ token: expoTokenSchema, deviceLabel: z.string().max(120).optional() }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      await ctx.db
        .insert(pushDestination)
        .values({
          userId: ctx.authUserId,
          platform: 'expo',
          expoPushToken: input.token,
          deviceLabel: input.deviceLabel ?? null,
          enabled: true,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: pushDestination.expoPushToken,
          set: {
            userId: ctx.authUserId,
            platform: 'expo',
            deviceLabel: input.deviceLabel ?? null,
            enabled: true,
            updatedAt: now,
          },
        });
      return { ok: true as const };
    }),

  registerWebPushSubscription: protectedProcedure
    .input(
      z.object({
        subscription: webPushSubscriptionSchema,
        deviceLabel: z.string().max(120).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      await ctx.db
        .insert(pushDestination)
        .values({
          userId: ctx.authUserId,
          platform: 'webpush',
          webpushEndpoint: input.subscription.endpoint,
          webpushP256dh: input.subscription.p256dh,
          webpushAuth: input.subscription.auth,
          deviceLabel: input.deviceLabel ?? null,
          enabled: true,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: pushDestination.webpushEndpoint,
          set: {
            userId: ctx.authUserId,
            platform: 'webpush',
            webpushP256dh: input.subscription.p256dh,
            webpushAuth: input.subscription.auth,
            deviceLabel: input.deviceLabel ?? null,
            enabled: true,
            updatedAt: now,
          },
        });
      return { ok: true as const };
    }),

  listDestinations: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(pushDestination)
      .where(eq(pushDestination.userId, ctx.authUserId))
      .orderBy(pushDestination.createdAt);
    return rows;
  }),

  disableDestination: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      const [row] = await ctx.db
        .select()
        .from(pushDestination)
        .where(and(eq(pushDestination.id, input.id), eq(pushDestination.userId, ctx.authUserId)))
        .limit(1);
      if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Destination not found.' });
      await ctx.db
        .update(pushDestination)
        .set({ enabled: false, updatedAt: now })
        .where(eq(pushDestination.id, input.id));
      return { ok: true as const };
    }),

  /** Debug helper to verify enqueue path in dev (lawyer/user only). */
  enqueueSelfTest: protectedProcedure
    .input(z.object({ title: z.string().min(1).max(120), body: z.string().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      const dedupeKey = `selftest:${ctx.authUserId}:${now.toISOString()}`;
      await ctx.db.insert(notificationJob).values({
        userId: ctx.authUserId,
        kind: 'case_update',
        dedupeKey,
        scheduledAt: now,
        payloadJson: { title: input.title, body: input.body, url: '/app' },
        updatedAt: now,
      });
      return { ok: true as const };
    }),
});
