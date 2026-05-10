import { z } from 'zod';

import { EMERGENCY_SCENARIOS } from './scenarios-data';
import type { EmergencyScenario } from './types';

const SLUG_SET = new Set(EMERGENCY_SCENARIOS.map((s) => s.slug));

export function getScenarioBySlug(slug: string): EmergencyScenario | null {
  return EMERGENCY_SCENARIOS.find((s) => s.slug === slug) ?? null;
}

export function isKnownScenarioSlug(slug: string): boolean {
  return SLUG_SET.has(slug);
}

export const personalizeInputSchema = z
  .object({
    slug: z.string().min(1).max(80),
    stateCode: z
      .string()
      .length(2)
      .transform((c) => c.toUpperCase()),
    answers: z
      .record(z.string().min(1).max(64), z.string().max(2000))
      .superRefine((answers, ctx) => {
        const keys = Object.keys(answers);
        if (keys.length > 32) {
          ctx.addIssue({ code: 'custom', message: 'Too many answer fields.' });
        }
      }),
  })
  .superRefine((val, ctx) => {
    if (!SLUG_SET.has(val.slug)) {
      ctx.addIssue({ code: 'custom', path: ['slug'], message: 'Unknown scenario slug.' });
    }
  });

export type PersonalizeInput = z.infer<typeof personalizeInputSchema>;

export function validatePersonalizeInputAgainstScenario(
  input: PersonalizeInput,
  scenario: EmergencyScenario,
): { ok: true } | { ok: false; message: string } {
  for (const q of scenario.contextQuestions) {
    if (q.required !== false) {
      const v = input.answers[q.id];
      if (v === undefined || v.trim().length === 0) {
        return { ok: false, message: `Missing answer for: ${q.labelEn}` };
      }
    }
  }
  return { ok: true };
}
