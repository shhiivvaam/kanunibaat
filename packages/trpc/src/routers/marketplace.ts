import { and, avg, count, desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import {
  lawyerAvailability,
  lawyerConsultationReview,
  lawyerProfile,
  userProfile,
} from '@jurisly/database/schema';
import { searchLawyersWithFallback } from '@jurisly/search';

import { publicProcedure, router } from '../init';

const searchInputSchema = z.object({
  query: z.string().max(200).optional().default(''),
  limit: z.number().int().min(1).max(50).optional().default(24),
});

const bySlugInputSchema = z.object({
  slug: z.string().min(1).max(120),
});

export const marketplaceRouter = router({
  searchLawyers: publicProcedure.input(searchInputSchema).query(async ({ ctx, input }) => {
    const { hits, source } = await searchLawyersWithFallback(
      ctx.db,
      ctx.meili,
      ctx.meiliIndexName,
      input.query ?? '',
      input.limit,
    );
    return { hits, source };
  }),

  lawyerBySlug: publicProcedure.input(bySlugInputSchema).query(async ({ ctx, input }) => {
    const [row] = await ctx.db
      .select({
        userId: lawyerProfile.userId,
        slug: lawyerProfile.slug,
        headline: lawyerProfile.headline,
        bio: lawyerProfile.bio,
        city: lawyerProfile.city,
        barState: lawyerProfile.barState,
        practiceAreas: lawyerProfile.practiceAreas,
        languages: lawyerProfile.languages,
        yearsExperience: lawyerProfile.yearsExperience,
        verificationStatus: lawyerProfile.verificationStatus,
        displayName: userProfile.displayName,
        avatarUrl: userProfile.avatarUrl,
      })
      .from(lawyerProfile)
      .innerJoin(userProfile, eq(lawyerProfile.userId, userProfile.userId))
      .where(
        and(eq(lawyerProfile.slug, input.slug), eq(lawyerProfile.verificationStatus, 'verified')),
      )
      .limit(1);

    if (!row) {
      return { lawyer: null };
    }

    const lawyerUserId = row.userId;

    const [agg] = await ctx.db
      .select({
        avgRating: avg(lawyerConsultationReview.rating),
        reviewCount: count(),
      })
      .from(lawyerConsultationReview)
      .where(eq(lawyerConsultationReview.lawyerUserId, lawyerUserId));

    const recentReviews = await ctx.db
      .select({
        rating: lawyerConsultationReview.rating,
        reviewText: lawyerConsultationReview.reviewText,
        createdAt: lawyerConsultationReview.createdAt,
      })
      .from(lawyerConsultationReview)
      .where(eq(lawyerConsultationReview.lawyerUserId, lawyerUserId))
      .orderBy(desc(lawyerConsultationReview.createdAt))
      .limit(5);

    let avgFirstReplyMinutes: number | null = null;
    try {
      const stat = await ctx.db.execute(
        sql`
        SELECT ROUND(AVG(EXTRACT(EPOCH FROM (agg.first_created - c.started_at)) / 60.0)::numeric, 1)::float AS m
        FROM consultation c
        INNER JOIN (
          SELECT consultation_id, MIN(created_at) AS first_created
          FROM consultation_message
          WHERE sender_user_id = ${lawyerUserId}
          GROUP BY consultation_id
        ) agg ON agg.consultation_id = c.id
        WHERE c.lawyer_user_id = ${lawyerUserId}
          AND c.status = 'completed'
          AND c.started_at IS NOT NULL
          AND agg.first_created >= c.started_at
      `,
      );
      const firstRow = Array.isArray(stat)
        ? stat[0]
        : (stat as { rows?: { m: unknown }[] }).rows?.[0];
      const rawM =
        firstRow && typeof firstRow === 'object' && 'm' in firstRow
          ? (firstRow as { m: unknown }).m
          : null;
      if (rawM != null && rawM !== '') {
        const n = typeof rawM === 'number' ? rawM : Number(rawM);
        avgFirstReplyMinutes = Number.isFinite(n) ? n : null;
      }
    } catch {
      avgFirstReplyMinutes = null;
    }

    return {
      lawyer: {
        userId: row.userId,
        slug: row.slug,
        displayName: row.displayName,
        avatarUrl: row.avatarUrl,
        headline: row.headline,
        bio: row.bio,
        city: row.city,
        barState: row.barState,
        practiceAreas: Array.isArray(row.practiceAreas) ? row.practiceAreas : [],
        languages: Array.isArray(row.languages) ? row.languages : [],
        yearsExperience: row.yearsExperience,
        avgRating: agg?.avgRating != null ? Number(agg.avgRating) : null,
        reviewCount: Number(agg?.reviewCount ?? 0),
        avgFirstReplyMinutes,
        recentReviews: recentReviews.map((r) => ({
          rating: r.rating,
          reviewText: r.reviewText,
          createdAt: r.createdAt,
        })),
      },
    };
  }),

  availabilityByLawyerUserId: publicProcedure
    .input(z.object({ lawyerUserId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const [lp] = await ctx.db
        .select({ status: lawyerProfile.verificationStatus })
        .from(lawyerProfile)
        .where(
          and(
            eq(lawyerProfile.userId, input.lawyerUserId),
            eq(lawyerProfile.verificationStatus, 'verified'),
          ),
        )
        .limit(1);
      if (!lp) return { availability: [] as const };

      const rows = await ctx.db
        .select({
          id: lawyerAvailability.id,
          dayOfWeek: lawyerAvailability.dayOfWeek,
          startMinute: lawyerAvailability.startMinute,
          endMinute: lawyerAvailability.endMinute,
          timezone: lawyerAvailability.timezone,
        })
        .from(lawyerAvailability)
        .where(eq(lawyerAvailability.userId, input.lawyerUserId));
      return { availability: rows };
    }),
});
