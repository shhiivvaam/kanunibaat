import { TRPCError } from '@trpc/server';
import { and, asc, eq, ilike, or } from 'drizzle-orm';
import { z } from 'zod';

import { researchCentralAct, researchJudgment, researchStatuteCrosswalk } from '@kb/database/schema';
import { searchJudgmentsWithFallback } from '@kb/search';

import { suggestCitationChainWithOpenAI } from '../research/openai-citation-chain';
import { fillDraftTemplateWithOpenAI } from '../research/openai-draft-template';
import { expandResearchQueryWithOpenAI } from '../research/openai-expand-query';
import { summarizeJudgmentWithOpenAI } from '../research/openai-judgment-summary';
import { lawyerProcedure, router } from '../init';

const draftTemplateKeySchema = z.enum(['legal_notice_reply', 'bail_application_outline', 'written_statement_outline']);

function escapeLikePattern(s: string): string {
  return s.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
}

export const researchRouter = router({
  judgments: router({
    search: lawyerProcedure
      .input(
        z.object({
          query: z.string().max(500).default(''),
          limit: z.number().int().min(1).max(50).default(20),
          expandQuery: z.boolean().optional(),
        }),
      )
      .query(async ({ ctx, input }) => {
        let q = input.query.trim();
        if (input.expandQuery) {
          const key = ctx.openaiApiKey?.trim();
          if (!key) {
            throw new TRPCError({
              code: 'PRECONDITION_FAILED',
              message: 'Query expansion requires OPENAI_API_KEY on the API.',
            });
          }
          if (!q) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Query required for expansion.' });
          }
          q = await expandResearchQueryWithOpenAI(key, q);
        }
        return searchJudgmentsWithFallback(
          ctx.db,
          ctx.meili,
          ctx.meiliJudgmentsIndexName,
          q,
          input.limit,
        );
      }),

    byId: lawyerProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
      const [row] = await ctx.db.select().from(researchJudgment).where(eq(researchJudgment.id, input.id)).limit(1);
      if (!row) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Judgment not found.' });
      }
      return { judgment: row };
    }),

    summarize: lawyerProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
      const key = ctx.openaiApiKey?.trim();
      if (!key) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Judgment summarization requires OPENAI_API_KEY on the API.',
        });
      }
      const [row] = await ctx.db.select().from(researchJudgment).where(eq(researchJudgment.id, input.id)).limit(1);
      if (!row) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Judgment not found.' });
      }
      const excerpt = [row.summaryExcerpt, row.bodyForSearch].filter(Boolean).join('\n\n');
      const summary = await summarizeJudgmentWithOpenAI(key, {
        title: row.title,
        court: row.court,
        citation: row.citation,
        excerpt,
      });
      return { judgmentId: row.id, summary };
    }),
  }),

  citations: router({
    suggestChain: lawyerProcedure
      .input(
        z.object({
          seedCitation: z.string().min(1).max(400),
          contextNotes: z.string().max(2000).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const key = ctx.openaiApiKey?.trim();
        if (!key) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'Citation suggestions require OPENAI_API_KEY on the API.',
          });
        }
        const chain = await suggestCitationChainWithOpenAI(key, {
          seedCitation: input.seedCitation,
          contextNotes: input.contextNotes,
        });
        return chain;
      }),
  }),

  statutes: router({
    crosswalk: lawyerProcedure
      .input(
        z.object({
          sourceStatute: z.string().min(1).max(32),
          sourceSection: z.string().min(1).max(32),
          targetStatute: z.string().min(1).max(32).optional(),
        }),
      )
      .query(async ({ ctx, input }) => {
        const conditions = [
          eq(researchStatuteCrosswalk.sourceStatute, input.sourceStatute.trim()),
          eq(researchStatuteCrosswalk.sourceSection, input.sourceSection.trim()),
        ];
        if (input.targetStatute?.trim()) {
          conditions.push(eq(researchStatuteCrosswalk.targetStatute, input.targetStatute.trim()));
        }
        const rows = await ctx.db
          .select()
          .from(researchStatuteCrosswalk)
          .where(and(...conditions));
        return { rows };
      }),
  }),

  acts: router({
    list: lawyerProcedure
      .input(z.object({ category: z.string().max(64).optional() }).optional())
      .query(async ({ ctx, input }) => {
        const cat = input?.category?.trim();
        if (cat) {
          return {
            acts: await ctx.db
              .select()
              .from(researchCentralAct)
              .where(eq(researchCentralAct.category, cat))
              .orderBy(asc(researchCentralAct.shortTitle)),
          };
        }
        return {
          acts: await ctx.db.select().from(researchCentralAct).orderBy(asc(researchCentralAct.shortTitle)),
        };
      }),

    search: lawyerProcedure
      .input(
        z.object({
          query: z.string().max(200).optional(),
          category: z.string().max(64).optional(),
        }),
      )
      .query(async ({ ctx, input }) => {
        const q = input.query?.trim();
        const cat = input.category?.trim();
        if (!q) {
          if (cat) {
            return {
              acts: await ctx.db
                .select()
                .from(researchCentralAct)
                .where(eq(researchCentralAct.category, cat))
                .orderBy(asc(researchCentralAct.shortTitle)),
            };
          }
          return {
            acts: await ctx.db.select().from(researchCentralAct).orderBy(asc(researchCentralAct.shortTitle)),
          };
        }
        const term = `%${escapeLikePattern(q)}%`;
        const titleMatch = ilike(researchCentralAct.shortTitle, term);
        const descMatch = ilike(researchCentralAct.description, term);
        const orExpr = or(titleMatch, descMatch)!;
        const rows = cat
          ? await ctx.db
            .select()
            .from(researchCentralAct)
            .where(and(eq(researchCentralAct.category, cat), orExpr))
            .orderBy(asc(researchCentralAct.shortTitle))
            .limit(40)
          : await ctx.db
            .select()
            .from(researchCentralAct)
            .where(orExpr)
            .orderBy(asc(researchCentralAct.shortTitle))
            .limit(40);
        return { acts: rows };
      }),
  }),

  drafting: router({
    fillTemplate: lawyerProcedure
      .input(
        z.object({
          templateKey: draftTemplateKeySchema,
          facts: z
            .record(z.string().max(80), z.string().max(2000))
            .refine((o) => Object.keys(o).length <= 24, { message: 'At most 24 fact keys.' }),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const key = ctx.openaiApiKey?.trim();
        if (!key) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'Drafting requires OPENAI_API_KEY on the API.',
          });
        }
        const draft = await fillDraftTemplateWithOpenAI(key, input.templateKey, input.facts);
        return { draft };
      }),
  }),
});
