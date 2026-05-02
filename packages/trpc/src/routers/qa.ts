import { TRPCError } from '@trpc/server';
import { and, asc, count, desc, eq, ilike, sql } from 'drizzle-orm';
import { z } from 'zod';

import { lawyerProfile, qaAnswer, qaQuestion, qaVote } from '@jurisly/database/schema';

import { computeEntitlementsForUser } from '../billing/entitlements';
import type { TrpcContext } from '../context';
import { generateQaPreviewWithOpenAI } from '../qa/openai-preview';
import { protectedProcedure, publicProcedure, router } from '../init';

type Db = TrpcContext['db'];

function escapeLikePattern(s: string): string {
  return s.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
}

async function assertVerifiedLawyer(db: Db, userId: string): Promise<void> {
  const [row] = await db
    .select({ userId: lawyerProfile.userId, status: lawyerProfile.verificationStatus })
    .from(lawyerProfile)
    .where(eq(lawyerProfile.userId, userId))
    .limit(1);
  if (row?.status !== 'verified') {
    throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Lawyer is not verified.' });
  }
}

const questionCreateSchema = z.object({
  title: z.string().min(10).max(200),
  body: z.string().min(20).max(4000),
  category: z.string().max(80).optional().default(''),
  isAnonymous: z.boolean().optional().default(true),
});

export const qaRouter = router({
  question: router({
    list: publicProcedure
      .input(
        z
          .object({
            category: z.string().max(80).optional(),
            q: z.string().max(200).optional(),
            limit: z.number().int().min(1).max(50).default(20),
          })
          .optional(),
      )
      .query(async ({ ctx, input }) => {
        const category = input?.category?.trim();
        const q = input?.q?.trim();
        const limit = input?.limit ?? 20;

        const where = and(
          sql`${qaQuestion.status} != 'hidden'`,
          category ? eq(qaQuestion.category, category) : undefined,
          q ? ilike(qaQuestion.title, `%${escapeLikePattern(q)}%`) : undefined,
        );

        const rows = await ctx.db
          .select({
            question: qaQuestion,
            answersCount: count(qaAnswer.id),
            votesUp: sql<number>`sum(case when ${qaVote.value} = 'up' then 1 else 0 end)`,
          })
          .from(qaQuestion)
          .leftJoin(qaAnswer, eq(qaAnswer.questionId, qaQuestion.id))
          .leftJoin(qaVote, eq(qaVote.questionId, qaQuestion.id))
          .where(where)
          .groupBy(qaQuestion.id)
          .orderBy(desc(qaQuestion.createdAt))
          .limit(limit);

        return {
          items: rows.map((r) => ({
            ...r.question,
            answersCount: Number(r.answersCount ?? 0),
            votesUp: Number(r.votesUp ?? 0),
          })),
        };
      }),

    byId: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const [q] = await ctx.db
          .select()
          .from(qaQuestion)
          .where(eq(qaQuestion.id, input.id))
          .limit(1);
        if (!q || q.status === 'hidden')
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Question not found.' });
        const answers = await ctx.db
          .select()
          .from(qaAnswer)
          .where(eq(qaAnswer.questionId, q.id))
          .orderBy(desc(qaAnswer.isBest), asc(qaAnswer.createdAt));

        const [votes] = await ctx.db
          .select({
            up: sql<number>`sum(case when ${qaVote.value} = 'up' then 1 else 0 end)`,
            down: sql<number>`sum(case when ${qaVote.value} = 'down' then 1 else 0 end)`,
          })
          .from(qaVote)
          .where(eq(qaVote.questionId, q.id));

        return {
          question: q,
          answers,
          votes: { up: Number(votes?.up ?? 0), down: Number(votes?.down ?? 0) },
        };
      }),

    create: protectedProcedure.input(questionCreateSchema).mutation(async ({ ctx, input }) => {
      const now = new Date();
      const [row] = await ctx.db
        .insert(qaQuestion)
        .values({
          askerUserId: ctx.authUserId,
          title: input.title,
          body: input.body,
          category: input.category ?? '',
          isAnonymous: input.isAnonymous ?? true,
          status: 'open',
          updatedAt: now,
        })
        .returning();
      return { question: row ?? null };
    }),

    aiPreview: protectedProcedure
      .input(z.object({ id: z.string().uuid(), locale: z.string().min(2).max(16).default('en') }))
      .mutation(async ({ ctx, input }) => {
        const ent = await computeEntitlementsForUser({
          db: ctx.db,
          userId: ctx.authUserId,
          now: new Date(),
        });
        if (!ent.limits.aiEnabled) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'AI features require Pro plan',
          });
        }

        const [q] = await ctx.db
          .select()
          .from(qaQuestion)
          .where(eq(qaQuestion.id, input.id))
          .limit(1);
        if (!q) throw new TRPCError({ code: 'NOT_FOUND', message: 'Question not found.' });
        if (q.aiPreviewJson) return { preview: q.aiPreviewJson };
        if (!ctx.openaiApiKey)
          throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'AI is not configured.' });

        const preview = await generateQaPreviewWithOpenAI({
          apiKey: ctx.openaiApiKey,
          title: q.title,
          body: q.body,
          locale: input.locale,
        });
        const now = new Date();
        await ctx.db
          .update(qaQuestion)
          .set({ aiPreviewJson: preview as unknown as Record<string, unknown>, updatedAt: now })
          .where(eq(qaQuestion.id, q.id));
        return { preview };
      }),
  }),

  answer: router({
    create: protectedProcedure
      .input(z.object({ questionId: z.string().uuid(), body: z.string().min(20).max(8000) }))
      .mutation(async ({ ctx, input }) => {
        await assertVerifiedLawyer(ctx.db, ctx.authUserId);
        const [q] = await ctx.db
          .select()
          .from(qaQuestion)
          .where(eq(qaQuestion.id, input.questionId))
          .limit(1);
        if (!q || q.status === 'hidden')
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Question not found.' });

        const now = new Date();
        const [row] = await ctx.db
          .insert(qaAnswer)
          .values({
            questionId: input.questionId,
            authorUserId: ctx.authUserId,
            body: input.body,
            updatedAt: now,
          })
          .returning();
        await ctx.db
          .update(qaQuestion)
          .set({ status: 'answered', updatedAt: now })
          .where(eq(qaQuestion.id, input.questionId));
        return { answer: row ?? null };
      }),
  }),

  vote: router({
    set: protectedProcedure
      .input(z.object({ questionId: z.string().uuid(), value: z.enum(['up', 'down']).nullable() }))
      .mutation(async ({ ctx, input }) => {
        const now = new Date();
        if (input.value === null) {
          await ctx.db
            .delete(qaVote)
            .where(
              and(eq(qaVote.questionId, input.questionId), eq(qaVote.voterUserId, ctx.authUserId)),
            );
          return { ok: true as const };
        }

        await ctx.db
          .insert(qaVote)
          .values({
            questionId: input.questionId,
            voterUserId: ctx.authUserId,
            value: input.value,
          })
          .onConflictDoUpdate({
            target: [qaVote.questionId, qaVote.voterUserId],
            set: { value: input.value, createdAt: now },
          });
        return { ok: true as const };
      }),
  }),
});
