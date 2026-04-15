import { INDIAN_STATES_AND_UTS } from './indian-states';

import type { PersonalizedGuide } from './personalized-output';
import { personalizedGuideSchema } from './personalized-output';
import type { EmergencyScenario, EmergencyScenarioSummary, GuideSections } from './types';

const STATE_CODES = new Set(INDIAN_STATES_AND_UTS.map((s) => s.code));

export function isValidIndianStateCode(code: string): boolean {
  return STATE_CODES.has(code.toUpperCase());
}

export function stateNameFromCode(code: string): string | null {
  const row = INDIAN_STATES_AND_UTS.find((s) => s.code === code.toUpperCase());
  return row?.name ?? null;
}

export function scenarioSummaries(scenarios: readonly EmergencyScenario[]): EmergencyScenarioSummary[] {
  return scenarios.map((s) => ({
    slug: s.slug,
    urgency: s.urgency,
    titleEn: s.titleEn,
    titleHi: s.titleHi,
    lawyerSearchHint: s.lawyerSearchHint,
  }));
}

export function guideFromBase(base: GuideSections): PersonalizedGuide {
  const raw = {
    right_now: [...base.rightNow],
    your_rights: [...base.rights],
    documents: [...base.documents],
    what_not_to_do: [...base.whatNotToDo],
    police_or_court: [...base.policeOrCourt],
    timeline: [...base.timeline],
    applicable_laws: [...base.applicableLaws],
  };
  const parsed = personalizedGuideSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Base scenario content failed schema: ${parsed.error.message}`);
  }
  return parsed.data;
}
