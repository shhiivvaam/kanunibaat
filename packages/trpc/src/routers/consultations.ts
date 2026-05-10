import { TRPCError } from '@trpc/server';
import { and, asc, desc, eq, inArray, or } from 'drizzle-orm';
import { z } from 'zod';

import {
  consultation,
  consultationMessage,
  lawyerAvailability,
  lawyerConsultationReview,
  lawyerProfile,
  notificationJob,
  payment,
  userProfile,
} from '@jurisly/database/schema';

import type { TrpcContext } from '../context';
import { mintLiveKitConsultationToken } from '../consultations/livekit-token';
import { createRazorpayOrder, requireConfiguredRazorpay } from '../integrations/razorpay';
import { writeAuditLog } from '../lib/audit-log';
import { verifyRazorpayClientSignature } from '../lib/razorpay-client-signature';
import { protectedProcedure, router } from '../init';
import { makeDedupeKey } from '../notifications/payload';
import { computeReminderTimes, HEARING_REMINDER_OFFSETS_MS } from '../notifications/schedule';

type TrpcDb = TrpcContext['db'];
type LawyerAvailabilityRow = typeof lawyerAvailability.$inferSelect;

const DEFAULT_CONSULTATION_AMOUNT_INR = 499;
const MAX_MESSAGE_BODY_CHARS = 4000;

function timePartsForZone(
  date: Date,
  timeZone: string,
): { dayOfWeek: number; minuteOfDay: number } {
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

    const row = await ctx.db.transaction(async (tx) => {
      const slots: LawyerAvailabilityRow[] = await tx
        .select()
        .from(lawyerAvailability)
        .where(eq(lawyerAvailability.userId, input.lawyerUserId))
        .orderBy(asc(lawyerAvailability.startMinute))
        .for('update');

      let availableSlot: LawyerAvailabilityRow | null = null;
      for (const slot of slots) {
        const slotTz = slot.timezone || 'Asia/Kolkata';
        const { dayOfWeek, minuteOfDay } = timePartsForZone(scheduledAt, slotTz);
        if (
          slot.dayOfWeek === dayOfWeek &&
          minuteOfDay >= slot.startMinute &&
          minuteOfDay < slot.endMinute
        ) {
          availableSlot = slot;
          break;
        }
      }

      if (!availableSlot) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Selected slot is not available.',
        });
      }

      const conflicts = await tx
        .select()
        .from(consultation)
        .where(
          and(
            eq(consultation.lawyerUserId, input.lawyerUserId),
            eq(consultation.scheduledAt, scheduledAt),
            inArray(consultation.status, ['scheduled', 'in_progress']),
          ),
        )
        .for('update');

      if (conflicts.length > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Slot no longer available. Please choose another time.',
        });
      }

      const [insertedRow] = await tx
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

      if (!insertedRow) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create consultation.',
        });
      }

      return insertedRow;
    });

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
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Consultation is not awaiting payment.',
        });
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

      if (
        !verifyRazorpayClientSignature({
          secret,
          orderId: input.razorpayOrderId,
          paymentId: input.razorpayPaymentId,
          clientSignature: input.razorpaySignature,
        })
      ) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid payment signature.' });
      }

      await ctx.db.transaction(async (tx) => {
        const [c] = await tx
          .select()
          .from(consultation)
          .where(and(eq(consultation.id, input.consultationId), eq(consultation.userId, userId)))
          .limit(1);
        if (!c) throw new TRPCError({ code: 'NOT_FOUND', message: 'Consultation not found.' });

        const [p] = await tx
          .select()
          .from(payment)
          .where(eq(payment.consultationId, c.id))
          .limit(1);
        if (!p) {
          throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Payment record missing.' });
        }
        if (p.status === 'paid' || p.status === 'released') {
          return;
        }
        if (p.razorpayOrderId && p.razorpayOrderId !== input.razorpayOrderId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Order does not match this consultation payment.',
          });
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

        if (c.scheduledAt) {
          const reminderTimes = computeReminderTimes({
            at: c.scheduledAt,
            offsetsMs: HEARING_REMINDER_OFFSETS_MS,
          });
          for (const t of reminderTimes) {
            const offsetMs = c.scheduledAt.getTime() - t.getTime();
            const dedupeKey = makeDedupeKey(['consultation', c.id, offsetMs, 'reminder']);
            await tx
              .insert(notificationJob)
              .values({
                userId: c.userId,
                kind: 'consultation_reminder',
                dedupeKey,
                scheduledAt: t,
                payloadJson: {
                  title: 'Consultation reminder',
                  body: 'Your consultation is coming up soon.',
                  url: `/app/consultations/${c.id}`,
                  mobilePath: `/consultations/${c.id}`,
                  data: { consultationId: c.id, scheduledAt: c.scheduledAt.toISOString() },
                },
                updatedAt: new Date(),
              })
              .onConflictDoUpdate({
                target: notificationJob.dedupeKey,
                set: {
                  scheduledAt: t,
                  status: 'pending',
                  sentAt: null,
                  payloadJson: {
                    title: 'Consultation reminder',
                    body: 'Your consultation is coming up soon.',
                    url: `/app/consultations/${c.id}`,
                    mobilePath: `/consultations/${c.id}`,
                    data: { consultationId: c.id, scheduledAt: c.scheduledAt.toISOString() },
                  },
                  updatedAt: new Date(),
                },
              });
          }
        }
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

  byId: protectedProcedure
    .input(z.object({ consultationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.authUserId;
      const [c] = await ctx.db
        .select()
        .from(consultation)
        .where(
          and(
            eq(consultation.id, input.consultationId),
            or(eq(consultation.userId, userId), eq(consultation.lawyerUserId, userId)),
          ),
        )
        .limit(1);
      if (!c) throw new TRPCError({ code: 'NOT_FOUND', message: 'Consultation not found.' });

      const [p] = await ctx.db
        .select()
        .from(payment)
        .where(eq(payment.consultationId, c.id))
        .limit(1);
      const [rev] = await ctx.db
        .select()
        .from(lawyerConsultationReview)
        .where(eq(lawyerConsultationReview.consultationId, c.id))
        .limit(1);
      return { consultation: c, payment: p ?? null, review: rev ?? null };
    }),

  submitVerifiedReview: protectedProcedure
    .input(
      z.object({
        consultationId: z.string().uuid(),
        rating: z.number().int().min(1).max(5),
        reviewText: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.authUserId;
      const [existing] = await ctx.db
        .select({ id: lawyerConsultationReview.id })
        .from(lawyerConsultationReview)
        .where(eq(lawyerConsultationReview.consultationId, input.consultationId))
        .limit(1);
      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You already submitted a review for this consultation.',
        });
      }
      const [c] = await ctx.db
        .select()
        .from(consultation)
        .where(and(eq(consultation.id, input.consultationId), eq(consultation.userId, uid)))
        .limit(1);
      if (!c) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Consultation not found.' });
      }
      if (c.status !== 'completed') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'You can review only completed consultations.',
        });
      }

      await ctx.db.insert(lawyerConsultationReview).values({
        consultationId: c.id,
        reviewerUserId: uid,
        lawyerUserId: c.lawyerUserId,
        rating: input.rating,
        reviewText: input.reviewText?.trim() ? input.reviewText.trim().slice(0, 2000) : null,
      });
      await writeAuditLog({
        db: ctx.db,
        userId: uid,
        action: 'consultation.review.created',
        entityType: 'consultation',
        entityId: c.id,
        metadata: {
          lawyerUserId: c.lawyerUserId,
          rating: input.rating,
        },
        ipAddress: ctx.requestIp ?? undefined,
        userAgent: ctx.userAgent ?? undefined,
      });

      return { ok: true as const };
    }),

  liveKit: router({
    getToken: protectedProcedure
      .input(z.object({ consultationId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const uid = ctx.authUserId;
        if (!ctx.livekitApiKey || !ctx.livekitApiSecret || !ctx.livekitUrl) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'LiveKit is not configured.',
          });
        }
        const [c] = await ctx.db
          .select()
          .from(consultation)
          .where(
            and(
              eq(consultation.id, input.consultationId),
              or(eq(consultation.userId, uid), eq(consultation.lawyerUserId, uid)),
            ),
          )
          .limit(1);
        if (!c) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Consultation not found.' });
        }
        if (c.mode !== 'audio' && c.mode !== 'video') {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'LiveKit is only available for audio or video consultations.',
          });
        }
        if (!['scheduled', 'in_progress'].includes(c.status)) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'Join is only allowed while the consultation is scheduled or in progress.',
          });
        }
        const [prof] = await ctx.db
          .select({ displayName: userProfile.displayName })
          .from(userProfile)
          .where(eq(userProfile.userId, uid))
          .limit(1);
        const participantName =
          typeof prof?.displayName === 'string' && prof.displayName.trim().length > 0
            ? prof.displayName.trim().slice(0, 120)
            : `user_${uid.slice(0, 8)}`;
        const roomName = `consultation:${c.id}`;
        const token = await mintLiveKitConsultationToken({
          apiKey: ctx.livekitApiKey,
          apiSecret: ctx.livekitApiSecret,
          roomName,
          participantIdentity: uid,
          participantName,
        });

        ctx.logger.info(
          {
            consultation_id: c.id,
            user_id: uid,
            provider: 'livekit',
          },
          'Consultation LiveKit token issued',
        );

        return {
          url: ctx.livekitUrl.replace(/\/$/, ''),
          roomName,
          token,
        };
      }),
  }),

  start: protectedProcedure
    .input(z.object({ consultationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.authUserId;
      const [c] = await ctx.db
        .select()
        .from(consultation)
        .where(
          and(eq(consultation.id, input.consultationId), eq(consultation.lawyerUserId, userId)),
        )
        .limit(1);
      if (!c) throw new TRPCError({ code: 'NOT_FOUND', message: 'Consultation not found.' });
      if (c.status !== 'scheduled') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Consultation is not scheduled.',
        });
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
          .where(
            and(eq(consultation.id, input.consultationId), eq(consultation.lawyerUserId, userId)),
          )
          .limit(1);
        if (!c) throw new TRPCError({ code: 'NOT_FOUND', message: 'Consultation not found.' });
        if (c.status !== 'in_progress') {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'Consultation is not in progress.',
          });
        }

        await tx
          .update(consultation)
          .set({ status: 'completed', endedAt: new Date(), updatedAt: new Date() })
          .where(eq(consultation.id, c.id));

        const [p] = await tx
          .select()
          .from(payment)
          .where(eq(payment.consultationId, c.id))
          .limit(1);
        if (p?.status === 'paid') {
          await tx
            .update(payment)
            .set({ status: 'released', releasedAt: new Date(), updatedAt: new Date() })
            .where(eq(payment.id, p.id));
        }
      });
      return { ok: true as const };
    }),

  cancel: protectedProcedure
    .input(
      z.object({
        consultationId: z.string().uuid(),
        reason: z.string().min(10).max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.authUserId;
      await ctx.db.transaction(async (tx) => {
        const [c] = await tx
          .select()
          .from(consultation)
          .where(
            and(
              eq(consultation.id, input.consultationId),
              or(eq(consultation.userId, userId), eq(consultation.lawyerUserId, userId)),
            ),
          )
          .limit(1);
        if (!c) throw new TRPCError({ code: 'NOT_FOUND', message: 'Consultation not found.' });
        if (c.status === 'completed' || c.status === 'cancelled') {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'Cannot cancel completed or already cancelled consultation.',
          });
        }

        await tx
          .update(consultation)
          .set({ status: 'cancelled', updatedAt: new Date() })
          .where(eq(consultation.id, c.id));
      });
      return { ok: true as const };
    }),

  dispute: protectedProcedure
    .input(z.object({ consultationId: z.string().uuid(), reason: z.string().min(20).max(1000) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.authUserId;
      await ctx.db.transaction(async (tx) => {
        const [c] = await tx
          .select()
          .from(consultation)
          .where(and(eq(consultation.id, input.consultationId), eq(consultation.userId, userId)))
          .limit(1);
        if (!c) throw new TRPCError({ code: 'NOT_FOUND', message: 'Consultation not found.' });
        if (c.status !== 'completed') {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'Can only dispute completed consultations.',
          });
        }

        await tx
          .update(consultation)
          .set({ status: 'disputed', updatedAt: new Date() })
          .where(eq(consultation.id, c.id));
      });
      return { ok: true as const };
    }),

  refund: protectedProcedure
    .input(z.object({ consultationId: z.string().uuid() }))
    .use(({ ctx, next }) => {
      if (!ctx.roles.includes('admin')) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required for refunds.' });
      }
      return next({ ctx });
    })
    .mutation(async ({ ctx, input }) => {
      const { id: keyId, secret: keySecret } = requireConfiguredRazorpay(ctx);

      const { paymentId, amountInrPaise } = await ctx.db.transaction(async (tx) => {
        const [c] = await tx
          .select()
          .from(consultation)
          .where(eq(consultation.id, input.consultationId))
          .limit(1);
        if (!c) throw new TRPCError({ code: 'NOT_FOUND', message: 'Consultation not found.' });

        const [p] = await tx
          .select()
          .from(payment)
          .where(eq(payment.consultationId, c.id))
          .limit(1);
        if (p?.status !== 'paid') {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'No paid payment found for this consultation.',
          });
        }
        if (!p.razorpayPaymentId) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'Missing payment ID for refund.',
          });
        }
        return { paymentId: p.razorpayPaymentId, amountInrPaise: p.amountInr * 100 };
      });

      const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: {
          authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ amount: amountInrPaise }),
      });

      if (!res.ok) {
        await res.text().catch(() => '');
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Refund could not be completed. Please try again or contact support.',
        });
      }

      const parsedRefund = z.object({ id: z.string().min(1) }).safeParse(await res.json());
      if (!parsedRefund.success) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Invalid payment provider response.',
        });
      }

      await ctx.db.transaction(async (tx) => {
        const [c] = await tx
          .select()
          .from(consultation)
          .where(eq(consultation.id, input.consultationId))
          .limit(1);
        if (!c) throw new TRPCError({ code: 'NOT_FOUND', message: 'Consultation not found.' });

        const [p] = await tx
          .select()
          .from(payment)
          .where(eq(payment.consultationId, c.id))
          .limit(1);
        if (p?.status !== 'paid' || p?.razorpayPaymentId !== paymentId) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Payment state changed during refund. No updates were applied.',
          });
        }

        await tx
          .update(payment)
          .set({ status: 'refunded', updatedAt: new Date() })
          .where(eq(payment.id, p.id));

        await tx
          .update(consultation)
          .set({ status: 'cancelled', updatedAt: new Date() })
          .where(eq(consultation.id, c.id));

        await writeAuditLog({
          db: tx,
          userId: ctx.authUserId,
          action: 'admin.consultation.refund',
          entityType: 'payment',
          entityId: p.id,
          metadata: { consultationId: c.id, refundId: parsedRefund.data.id },
          ipAddress: ctx.requestIp ?? undefined,
          userAgent: ctx.userAgent ?? undefined,
        });
      });

      return { ok: true as const, refundId: parsedRefund.data.id };
    }),

  chat: router({
    sendMessage: protectedProcedure
      .input(
        z.object({
          consultationId: z.string().uuid(),
          body: z.string().min(1).max(MAX_MESSAGE_BODY_CHARS),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.authUserId;
        const [c] = await ctx.db
          .select({
            id: consultation.id,
            userId: consultation.userId,
            lawyerUserId: consultation.lawyerUserId,
          })
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
        if (!m)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to send message.',
          });

        ctx.notifyConsultationChatSubscribers?.(input.consultationId);

        const recipientUserId = userId === c.userId ? c.lawyerUserId : c.userId;
        if (recipientUserId) {
          const now = new Date();
          const dedupeKey = makeDedupeKey(['consultation_message', m.id, recipientUserId]);
          await ctx.db
            .insert(notificationJob)
            .values({
              userId: recipientUserId,
              kind: 'consultation_message',
              dedupeKey,
              scheduledAt: now,
              payloadJson: {
                title: 'New message',
                body: 'You have a new consultation message.',
                url: `/app/consultations/${input.consultationId}`,
                mobilePath: `/consultations/${input.consultationId}`,
                data: { consultationId: input.consultationId, messageId: m.id },
              },
              updatedAt: now,
            })
            .onConflictDoNothing({ target: notificationJob.dedupeKey });
        }
        return m;
      }),

    listMessages: protectedProcedure
      .input(
        z.object({
          consultationId: z.string().uuid(),
          limit: z.number().int().min(1).max(200).default(100),
        }),
      )
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
