import { TRPCError } from '@trpc/server';
import { and, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import { kbBillingEvent, kbPlan, kbSubscription } from '@jurisly/database/schema';

import { requireConfiguredRazorpay } from '../integrations/razorpay';
import { adminProcedure, protectedProcedure, publicProcedure, router } from '../init';
import { computeEntitlementsForUser, ensureDefaultPlans, PLAN_KEYS } from '../billing/entitlements';

const planKeySchema = z.enum(PLAN_KEYS);

export const billingRouter = router({
  plans: router({
    list: publicProcedure.query(async ({ ctx }) => {
      await ensureDefaultPlans(ctx.db);
      const rows = await ctx.db
        .select({
          id: kbPlan.id,
          key: kbPlan.key,
          name: kbPlan.name,
          priceInr: kbPlan.priceInr,
          period: kbPlan.period,
          limitsJson: kbPlan.limitsJson,
        })
        .from(kbPlan)
        .orderBy(kbPlan.priceInr);
      return { plans: rows };
    }),
  }),

  subscription: router({
    me: protectedProcedure.query(async ({ ctx }) => {
      const [row] = await ctx.db
        .select({
          subscription: kbSubscription,
          plan: kbPlan,
        })
        .from(kbSubscription)
        .innerJoin(kbPlan, eq(kbSubscription.planId, kbPlan.id))
        .where(eq(kbSubscription.userId, ctx.authUserId))
        .orderBy(desc(kbSubscription.createdAt))
        .limit(1);
      return { subscription: row?.subscription ?? null, plan: row?.plan ?? null };
    }),

    createOrUpdate: protectedProcedure
      .input(z.object({ planKey: planKeySchema }))
      .mutation(async ({ ctx, input }) => {
        if (input.planKey === 'free') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Free plan does not require a subscription.',
          });
        }
        const { id: keyId, secret: keySecret } = requireConfiguredRazorpay(ctx);
        await ensureDefaultPlans(ctx.db);

        const [plan] = await ctx.db
          .select()
          .from(kbPlan)
          .where(eq(kbPlan.key, input.planKey))
          .limit(1);
        if (!plan) throw new TRPCError({ code: 'NOT_FOUND', message: 'Plan not found.' });
        if (!plan.razorpayPlanId) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'Razorpay plan IDs are not configured yet.',
          });
        }

        const [existingActive] = await ctx.db
          .select()
          .from(kbSubscription)
          .where(
            and(eq(kbSubscription.userId, ctx.authUserId), eq(kbSubscription.status, 'active')),
          )
          .limit(1);

        if (existingActive?.razorpaySubscriptionId) {
          await cancelRazorpaySubscription({
            keyId,
            keySecret,
            subscriptionId: existingActive.razorpaySubscriptionId,
            cancelAtCycleEnd: false,
          });

          await ctx.db
            .update(kbSubscription)
            .set({ status: 'cancelled', updatedAt: new Date() })
            .where(eq(kbSubscription.id, existingActive.id));
        }

        const now = new Date();
        const rp = await createRazorpaySubscription({
          keyId,
          keySecret,
          razorpayPlanId: plan.razorpayPlanId,
          totalCount: 120,
          customerNotify: 1,
        });

        const [sub] = await ctx.db
          .insert(kbSubscription)
          .values({
            userId: ctx.authUserId,
            planId: plan.id,
            status: 'pending',
            razorpaySubscriptionId: rp.id,
            currentPeriodStartAt: rp.current_start ? new Date(rp.current_start * 1000) : null,
            currentPeriodEndAt: rp.current_end ? new Date(rp.current_end * 1000) : null,
            cancelAtPeriodEnd: false,
            updatedAt: now,
          })
          .returning();

        return { keyId, subscriptionId: rp.id, subscription: sub ?? null };
      }),

    cancel: protectedProcedure
      .input(
        z.object({
          subscriptionId: z.string().min(1),
          cancelAtPeriodEnd: z.boolean().default(true),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { secret: keySecret, id: keyId } = requireConfiguredRazorpay(ctx);

        const [sub] = await ctx.db
          .select()
          .from(kbSubscription)
          .where(
            and(
              eq(kbSubscription.userId, ctx.authUserId),
              eq(kbSubscription.razorpaySubscriptionId, input.subscriptionId),
            ),
          )
          .limit(1);
        if (!sub) throw new TRPCError({ code: 'NOT_FOUND', message: 'Subscription not found.' });

        await cancelRazorpaySubscription({
          keyId,
          keySecret,
          subscriptionId: input.subscriptionId,
          cancelAtCycleEnd: input.cancelAtPeriodEnd,
        });

        await ctx.db
          .update(kbSubscription)
          .set({ cancelAtPeriodEnd: input.cancelAtPeriodEnd, updatedAt: new Date() })
          .where(eq(kbSubscription.id, sub.id));

        return { ok: true as const };
      }),
  }),

  entitlements: router({
    me: protectedProcedure.query(async ({ ctx }) => {
      const e = await computeEntitlementsForUser({
        db: ctx.db,
        userId: ctx.authUserId,
        now: new Date(),
      });
      return { entitlements: e };
    }),
  }),

  billingHistory: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(50).default(20) }).optional())
      .query(async ({ ctx, input }) => {
        const limit = input?.limit ?? 20;
        const rows = await ctx.db
          .select({
            id: kbBillingEvent.id,
            type: kbBillingEvent.type,
            amountInr: kbBillingEvent.amountInr,
            currency: kbBillingEvent.currency,
            occurredAt: kbBillingEvent.occurredAt,
            receivedAt: kbBillingEvent.receivedAt,
            subscriptionId: kbBillingEvent.subscriptionId,
          })
          .from(kbBillingEvent)
          .where(eq(kbBillingEvent.userId, ctx.authUserId))
          .orderBy(desc(kbBillingEvent.occurredAt), desc(kbBillingEvent.receivedAt))
          .limit(limit);
        return { items: rows };
      }),
  }),

  analytics: router({
    mrr: adminProcedure.query(async ({ ctx }) => {
      const [row] = await ctx.db
        .select({
          mrrInr: sql<number>`coalesce(sum(${kbPlan.priceInr}), 0)::int`,
        })
        .from(kbSubscription)
        .innerJoin(kbPlan, eq(kbSubscription.planId, kbPlan.id))
        .where(eq(kbSubscription.status, 'active'));
      return { mrrInr: Number(row?.mrrInr ?? 0) };
    }),
    churn: adminProcedure.query(async ({ ctx }) => {
      const now = new Date();
      const windowStart = new Date(now.getTime() - 30 * 86_400_000);
      const [cancelled] = await ctx.db
        .select({
          n: sql<number>`count(*)::int`,
        })
        .from(kbSubscription)
        .where(
          and(
            eq(kbSubscription.status, 'cancelled'),
            sql`${kbSubscription.updatedAt} >= ${windowStart}`,
          ),
        );

      const [active] = await ctx.db
        .select({
          n: sql<number>`count(*)::int`,
        })
        .from(kbSubscription)
        .where(eq(kbSubscription.status, 'active'));

      const cancelledN = Number(cancelled?.n ?? 0);
      const activeN = Math.max(1, Number(active?.n ?? 0));
      return { churnRate: cancelledN / activeN };
    }),
    ltv: adminProcedure.query(async ({ ctx }) => {
      const [mrr] = await ctx.db
        .select({
          mrrInr: sql<number>`coalesce(sum(${kbPlan.priceInr}), 0)::int`,
        })
        .from(kbSubscription)
        .innerJoin(kbPlan, eq(kbSubscription.planId, kbPlan.id))
        .where(eq(kbSubscription.status, 'active'));

      const [active] = await ctx.db
        .select({ n: sql<number>`count(*)::int` })
        .from(kbSubscription)
        .where(eq(kbSubscription.status, 'active'));

      const mrrInr = Number(mrr?.mrrInr ?? 0);
      const activeN = Math.max(1, Number(active?.n ?? 0));
      const arpu = mrrInr / activeN;

      const now = new Date();
      const windowStart = new Date(now.getTime() - 30 * 86_400_000);
      const [cancelled] = await ctx.db
        .select({ n: sql<number>`count(*)::int` })
        .from(kbSubscription)
        .where(
          and(
            eq(kbSubscription.status, 'cancelled'),
            sql`${kbSubscription.updatedAt} >= ${windowStart}`,
          ),
        );

      const churnRate = Number(cancelled?.n ?? 0) / activeN;
      const ltvInr = churnRate > 0 ? Math.round(arpu / churnRate) : 0;
      return { ltvInr, arpuInr: arpu, churnRate };
    }),
  }),
});

async function createRazorpaySubscription(opts: {
  keyId: string;
  keySecret: string;
  razorpayPlanId: string;
  totalCount: number;
  customerNotify: 0 | 1;
}): Promise<{ id: string; status: string; current_start?: number; current_end?: number }> {
  const res = await fetch('https://api.razorpay.com/v1/subscriptions', {
    method: 'POST',
    headers: {
      authorization: `Basic ${Buffer.from(`${opts.keyId}:${opts.keySecret}`).toString('base64')}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      plan_id: opts.razorpayPlanId,
      total_count: opts.totalCount,
      customer_notify: opts.customerNotify,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Subscription creation failed (${res.status}). ${text}`,
    });
  }
  const json = (await res.json()) as unknown;
  const parsed = z
    .object({
      id: z.string().min(1),
      status: z.string().min(1),
      current_start: z.number().int().optional(),
      current_end: z.number().int().optional(),
    })
    .safeParse(json);
  if (!parsed.success)
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Invalid Razorpay response.' });
  return parsed.data;
}

async function cancelRazorpaySubscription(opts: {
  keyId: string;
  keySecret: string;
  subscriptionId: string;
  cancelAtCycleEnd: boolean;
}): Promise<void> {
  const res = await fetch(
    `https://api.razorpay.com/v1/subscriptions/${opts.subscriptionId}/cancel`,
    {
      method: 'POST',
      headers: {
        authorization: `Basic ${Buffer.from(`${opts.keyId}:${opts.keySecret}`).toString('base64')}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ cancel_at_cycle_end: opts.cancelAtCycleEnd ? 1 : 0 }),
    },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Subscription cancel failed (${res.status}). ${text}`,
    });
  }
}
