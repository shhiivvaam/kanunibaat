import { TRPCError } from '@trpc/server';
import { and, desc, eq, ilike, sql } from 'drizzle-orm';
import { z } from 'zod';

import { contentArticle } from '@jurisly/database/schema';

import { publicProcedure, router } from '../init';

const listInput = z
  .object({
    category: z.string().max(80).optional(),
    q: z.string().max(200).optional(),
    limit: z.number().int().min(1).max(50).default(20),
    cursor: z.string().uuid().optional(),
  })
  .optional();

export const contentRouter = router({
  article: router({
    list: publicProcedure.input(listInput).query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const category = input?.category?.trim();
      const q = input?.q?.trim();

      const where = and(
        eq(contentArticle.isPublished, true),
        category ? eq(contentArticle.category, category) : undefined,
        q ? ilike(contentArticle.slug, `%${q}%`) : undefined,
      );

      const rows = await ctx.db
        .select({
          id: contentArticle.id,
          slug: contentArticle.slug,
          category: contentArticle.category,
          lifeSituation: contentArticle.lifeSituation,
          titleJson: contentArticle.titleJson,
          publishedAt: contentArticle.publishedAt,
          views: contentArticle.views,
        })
        .from(contentArticle)
        .where(where)
        .orderBy(desc(contentArticle.publishedAt), desc(contentArticle.createdAt))
        .limit(limit);

      return { items: rows };
    }),

    bySlug: publicProcedure
      .input(z.object({ slug: z.string().min(1).max(200) }))
      .query(async ({ ctx, input }) => {
        const [row] = await ctx.db
          .select()
          .from(contentArticle)
          .where(and(eq(contentArticle.slug, input.slug), eq(contentArticle.isPublished, true)))
          .limit(1);
        if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Article not found.' });
        return { article: row };
      }),

    incrementViews: publicProcedure
      .input(z.object({ slug: z.string().min(1).max(200) }))
      .mutation(async ({ ctx, input }) => {
        await ctx.db
          .update(contentArticle)
          .set({ views: sql`${contentArticle.views} + 1`, updatedAt: new Date() })
          .where(and(eq(contentArticle.slug, input.slug), eq(contentArticle.isPublished, true)));
        return { ok: true as const };
      }),
  }),
});
