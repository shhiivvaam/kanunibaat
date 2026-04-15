import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { lawyerProfile, userProfile } from '@kb/database/schema';
import { searchLawyersWithFallback } from '@kb/search';

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
      .where(and(eq(lawyerProfile.slug, input.slug), eq(lawyerProfile.verificationStatus, 'verified')))
      .limit(1);

    if (!row) {
      return { lawyer: null };
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
      },
    };
  }),
});
