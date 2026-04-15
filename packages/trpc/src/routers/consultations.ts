import crypto from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { and, asc, desc, eq, or } from 'drizzle-orm';
import { z } from 'zod';

import { consultation, consultationMessage, lawyerAvailability, lawyerProfile, payment } from '@kb/database/schema';

import type { TrpcContext } from '../context';
import { protectedProcedure, router } from '../init';

type TrpcDb = TrpcContext['db'];
type LawyerAvailabilityRow = typeof lawyerAvailability.$inferSelect;

const DEFAULT_CONSULTATION_AMOUNT_INR = 499;
const MAX_MESSAGE_BODY_CHARS = 4000;

function requireConfiguredRazorpay(ctx: { razorpayKeyId: string | null; razorpayKeySecret: string | null }) {
  const idRaw = ctx.razorpayKeyId?.trim();
  const secretRaw = ctx.razorpayKeySecret?.trim();
  const id = idRaw && idRaw.length > 0 ? idRaw : null;
  const secret = secretRaw && secretRaw.length > 0 ? secretRaw : null;
  if (!id || !secret) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'Payments are not configured.',
    });
  }
  return { id, secret };
}

function computeRazorpayClientSignature(opts: { secret: string; orderId: string; paymentId: string }): string {
  const msg = `${opts.orderId}|${opts.paymentId}`;
  return crypto.createHmac('sha256', opts.secret).update(msg).digest('hex');
}

function timePartsForZone(date: Date, timeZone: string): { dayOfWeek: number; minuteOfDay: number } {
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date);
  const dayOfWeek =
    weekday === 'Sun'
      ? 0
      : weekday === 'Mon'
        ? 1
        : weekday === 'Tue'
          ? 2
          : weekday === 'Wed'
            ? 3
            : weekday === 'Thu'
              ? 4
              : weekday === 'Fri'
                ? 5
                : 6;

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const hh = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const mm = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  return { dayOfWeek, minuteOfDay: hh * 60 + mm };
}

async function assertLawyerIsVerified(db: TrpcDb, lawyerUserId: string) {
  const [lp] = await db
    .select({ status: lawyerProfile.verificationStatus })
    .from(lawyerProfile)
    .where(eq(lawyerProfile.userId, lawyerUserId))
    .limit(1);
  if (lp?.status !== 'verified') {
    throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Lawyer is not verified.' });
  }
}

async function assertSlotIsAvailable(db: TrpcDb, lawyerUserId: string, scheduledAt: Date, timeZone: string) {
  const { dayOfWeek, minuteOfDay } = timePartsForZone(scheduledAt, timeZone);
  const rows: LawyerAvailabilityRow[] = await db
    .select()
    .from(lawyerAvailability)
    .where(eq(lawyerAvailability.userId, lawyerUserId))
    .orderBy(asc(lawyerAvailability.startMinute));
  const ok = rows.some(
    (r) => r.dayOfWeek === dayOfWeek && minuteOfDay >= r.startMinute && minuteOfDay < r.endMinute,
  );
  if (!ok) {
    throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Selected slot is not available.' });
  }
}

async function createRazorpayOrder(opts: {
  keyId: string;
  keySecret: string;
  amountPaise: number;
  currency: string;
  receipt: string;
}) {
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      authorization: `Basic ${Buffer.from(`${opts.keyId}:${opts.keySecret}`).toString('base64')}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      amount: opts.amountPaise,
      currency: opts.currency,
      receipt: opts.receipt,
      payment_capture: 1,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Razorpay order creation failed (${res.status}). ${text}`,
    });
  }
  const json = (await res.json()) as unknown;
  const parsed = z
    .object({
      id: z.string().min(1),
      amount: z.number().int().positive(),
      currency: z.string().min(1),
    })
    .safeParse(json);
  if (!parsed.success) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Invalid Razorpay response.' });
  }
  return parsed.data;
}

const createInput = z.object({
  lawyerUserId: z.string().min(1),
  mode: z.enum(['chat', 'audio', 'video']),
  scheduledAtIso: z.string().datetime(),
  timeZone: z.string().min(1).default('Asia/Kolkata'),
  issueSummary: z.string().min(10).max(2000),
});

export const consultationsRouter = router({
  create: protectedProcedure.input(createInput).mutation(async ({ ctx, input }) => {
    const userId = ctx.authUserId;
    const scheduledAt = new Date(input.scheduledAtIso);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid scheduledAt.' });
    }
    await assertLawyerIsVerified(ctx.db, input.lawyerUserId);
    await assertSlotIsAvailable(ctx.db, input.lawyerUserId, scheduledAt, input.timeZone);

    const [row] = await ctx.db
      .insert(consultation)
      .values({
        userId,
        lawyerUserId: input.lawyerUserId,
        mode: input.mode,
        status: 'pending_payment',
        scheduledAt,
        issueSummary: input.issueSummary,
        amountInr: DEFAULT_CONSULTATION_AMOUNT_INR,
        currency: 'INR',
      })
      .returning();
    if (!row) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create consultation.' });
    }
    return { consultationId: row.id, amountInr: row.amountInr, currency: row.currency };
  }),

  createRazorpayOrder: protectedProcedure
    .input(z.object({ consultationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id: keyId, secret: keySecret } = requireConfiguredRazorpay(ctx);
      const userId = ctx.authUserId;

      const [c] = await ctx.db
        .select()
        .from(consultation)
        .where(and(eq(consultation.id, input.consultationId), eq(consultation.userId, userId)))
        .limit(1);
      if (!c) throw new TRPCError({ code: 'NOT_FOUND', message: 'Consultation not found.' });
      if (c.status !== 'pending_payment') {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Consultation is not awaiting payment.' });
      }

      const [existingPay] = await ctx.db
        .select()
        .from(payment)
        .where(eq(payment.consultationId, c.id))
        .limit(1);
      if (existingPay?.razorpayOrderId) {
        return {
          keyId,
          orderId: existingPay.razorpayOrderId,
          amountPaise: c.amountInr * 100,
          currency: c.currency,
        };
      }

      const order = await createRazorpayOrder({
        keyId,
        keySecret,
        amountPaise: c.amountInr * 100,
        currency: c.currency,
        receipt: `consultation:${c.id}`,
      });

      await ctx.db.transaction(async (tx) => {
        if (existingPay) {
          await tx
            .update(payment)
            .set({ razorpayOrderId: order.id, updatedAt: new Date() })
            .where(eq(payment.id, existingPay.id));
        } else {
          await tx.insert(payment).values({
            consultationId: c.id,
            status: 'created',
            amountInr: c.amountInr,
            currency: c.currency,
            razorpayOrderId: order.id,
          });
        }
      });

      return { keyId, orderId: order.id, amountPaise: order.amount, currency: order.currency };
    }),

  verifyPayment: protectedProcedure
    .input(
      z.object({
        consultationId: z.string().uuid(),
        razorpayOrderId: z.string().min(1),
        razorpayPaymentId: z.string().min(1),
        razorpaySignature: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { secret } = requireConfiguredRazorpay(ctx);
      const userId = ctx.authUserId;

      const expected = computeRazorpayClientSignature({
        secret,
        orderId: input.razorpayOrderId,
        paymentId: input.razorpayPaymentId,
      });
      if (expected !== input.razorpaySignature) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid payment signature.' });
      }

      await ctx.db.transaction(async (tx) => {
        const [c] = await tx
          .select()
          .from(consultation)
          .where(and(eq(consultation.id, input.consultationId), eq(consultation.userId, userId)))
          .limit(1);
        if (!c) throw new TRPCError({ code: 'NOT_FOUND', message: 'Consultation not found.' });

        const [p] = await tx.select().from(payment).where(eq(payment.consultationId, c.id)).limit(1);
        if (!p) {
          throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Payment record missing.' });
        }
        if (p.status === 'paid' || p.status === 'released') {
          return;
        }

        await tx
          .update(payment)
          .set({
            status: 'paid',
            razorpayOrderId: input.razorpayOrderId,
            razorpayPaymentId: input.razorpayPaymentId,
            razorpaySignature: input.razorpaySignature,
            paidAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(payment.id, p.id));

        await tx
          .update(consultation)
          .set({ status: 'scheduled', updatedAt: new Date() })
          .where(eq(consultation.id, c.id));
      });

      return { ok: true as const };
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.authUserId;
    const isLawyer = ctx.roles.includes('lawyer');
    const rows = await ctx.db
      .select()
      .from(consultation)
      .where(isLawyer ? eq(consultation.lawyerUserId, userId) : eq(consultation.userId, userId))
      .orderBy(desc(consultation.createdAt))
      .limit(50);
    return rows;
  }),

  byId: protectedProcedure.input(z.object({ consultationId: z.string().uuid() })).query(async ({ ctx, input }) => {
    const userId = ctx.authUserId;
    const [c] = await ctx.db
      .select()
      .from(consultation)
      .where(and(eq(consultation.id, input.consultationId), or(eq(consultation.userId, userId), eq(consultation.lawyerUserId, userId))))
      .limit(1);
    if (!c) throw new TRPCError({ code: 'NOT_FOUND', message: 'Consultation not found.' });

    const [p] = await ctx.db.select().from(payment).where(eq(payment.consultationId, c.id)).limit(1);
    return { consultation: c, payment: p ?? null };
  }),

  start: protectedProcedure
    .input(z.object({ consultationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.authUserId;
      const [c] = await ctx.db
        .select()
        .from(consultation)
        .where(and(eq(consultation.id, input.consultationId), eq(consultation.lawyerUserId, userId)))
        .limit(1);
      if (!c) throw new TRPCError({ code: 'NOT_FOUND', message: 'Consultation not found.' });
      if (c.status !== 'scheduled') {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Consultation is not scheduled.' });
      }
      await ctx.db
        .update(consultation)
        .set({ status: 'in_progress', startedAt: new Date(), updatedAt: new Date() })
        .where(eq(consultation.id, c.id));
      return { ok: true as const };
    }),

  end: protectedProcedure
    .input(z.object({ consultationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.authUserId;
      await ctx.db.transaction(async (tx) => {
        const [c] = await tx
          .select()
          .from(consultation)
          .where(and(eq(consultation.id, input.consultationId), eq(consultation.lawyerUserId, userId)))
          .limit(1);
        if (!c) throw new TRPCError({ code: 'NOT_FOUND', message: 'Consultation not found.' });
        if (c.status !== 'in_progress') {
          throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Consultation is not in progress.' });
        }

        await tx
          .update(consultation)
          .set({ status: 'completed', endedAt: new Date(), updatedAt: new Date() })
          .where(eq(consultation.id, c.id));

        const [p] = await tx.select().from(payment).where(eq(payment.consultationId, c.id)).limit(1);
        if (p?.status === 'paid') {
          await tx
            .update(payment)
            .set({ status: 'released', releasedAt: new Date(), updatedAt: new Date() })
            .where(eq(payment.id, p.id));
        }
      });
      return { ok: true as const };
    }),

  chat: router({
    sendMessage: protectedProcedure
      .input(z.object({ consultationId: z.string().uuid(), body: z.string().min(1).max(MAX_MESSAGE_BODY_CHARS) }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.authUserId;
        const [c] = await ctx.db
          .select({ id: consultation.id })
          .from(consultation)
          .where(
            and(
              eq(consultation.id, input.consultationId),
              or(eq(consultation.userId, userId), eq(consultation.lawyerUserId, userId)),
            ),
          )
          .limit(1);
        if (!c) throw new TRPCError({ code: 'NOT_FOUND', message: 'Consultation not found.' });

        const [m] = await ctx.db
          .insert(consultationMessage)
          .values({ consultationId: input.consultationId, senderUserId: userId, body: input.body })
          .returning();
        if (!m) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to send message.' });
        return m;
      }),

    listMessages: protectedProcedure
      .input(z.object({ consultationId: z.string().uuid(), limit: z.number().int().min(1).max(200).default(100) }))
      .query(async ({ ctx, input }) => {
        const userId = ctx.authUserId;
        const [c] = await ctx.db
          .select({ id: consultation.id })
          .from(consultation)
          .where(
            and(
              eq(consultation.id, input.consultationId),
              or(eq(consultation.userId, userId), eq(consultation.lawyerUserId, userId)),
            ),
          )
          .limit(1);
        if (!c) throw new TRPCError({ code: 'NOT_FOUND', message: 'Consultation not found.' });

        const rows = await ctx.db
          .select()
          .from(consultationMessage)
          .where(eq(consultationMessage.consultationId, input.consultationId))
          .orderBy(asc(consultationMessage.createdAt))
          .limit(input.limit);
        return rows;
      }),
  }),
});

