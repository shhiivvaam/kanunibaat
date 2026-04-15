import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import {
  EMERGENCY_SCENARIOS,
  getScenarioBySlug,
  guideFromBase,
  isValidIndianStateCode,
  LEGAL_INFO_DISCLAIMER,
  personalizeInputSchema,
  scenarioSummaries,
  stateNameFromCode,
  validatePersonalizeInputAgainstScenario,
} from '@kb/emergency-guide';

import { personalizeEmergencyGuideWithOpenAI } from '../emergency-guide/openai-personalize';
import { publicProcedure, router } from '../init';

export const emergencyGuideRouter = router({
  list: publicProcedure.query(() => ({
    scenarios: scenarioSummaries(EMERGENCY_SCENARIOS),
    disclaimer: LEGAL_INFO_DISCLAIMER,
  })),

  bySlug: publicProcedure.input(z.object({ slug: z.string().min(1).max(80) })).query(({ input }) => {
    const scenario = getScenarioBySlug(input.slug);
    if (!scenario) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Scenario not found.' });
    }
    return { scenario, disclaimer: LEGAL_INFO_DISCLAIMER };
  }),

  personalize: publicProcedure.input(personalizeInputSchema).mutation(async ({ ctx, input }) => {
    const scenario = getScenarioBySlug(input.slug);
    if (!scenario) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Scenario not found.' });
    }

    if (!isValidIndianStateCode(input.stateCode)) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid state code.' });
    }

    const answersCheck = validatePersonalizeInputAgainstScenario(input, scenario);
    if (!answersCheck.ok) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: answersCheck.message });
    }

    const stateName = stateNameFromCode(input.stateCode);
    if (!stateName) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid state code.' });
    }

    const apiKey = ctx.openaiApiKey?.trim();
    if (!apiKey) {
      return {
        mode: 'fallback' as const,
        guide: guideFromBase(scenario.base),
        notice: 'AI personalisation is not configured. Showing the general guide for your scenario.',
        disclaimer: LEGAL_INFO_DISCLAIMER,
      };
    }

    try {
      const guide = await personalizeEmergencyGuideWithOpenAI(apiKey, scenario, stateName, input.answers);
      return {
        mode: 'ai' as const,
        guide,
        notice: null as string | null,
        disclaimer: LEGAL_INFO_DISCLAIMER,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Personalisation failed.';
      return {
        mode: 'fallback' as const,
        guide: guideFromBase(scenario.base),
        notice: `Personalisation temporarily unavailable. ${message}`,
        disclaimer: LEGAL_INFO_DISCLAIMER,
      };
    }
  }),
});
