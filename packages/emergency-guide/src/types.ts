export type UrgencyTier = 'urgent' | 'serious' | 'informational';

export interface ContextQuestion {
  id: string;
  labelEn: string;
  labelHi: string;
  /** Default true */
  required?: boolean;
}

export interface GuideSections {
  readonly rightNow: readonly string[];
  readonly rights: readonly string[];
  readonly documents: readonly string[];
  readonly whatNotToDo: readonly string[];
  readonly policeOrCourt: readonly string[];
  readonly timeline: readonly string[];
  readonly applicableLaws: readonly string[];
}

export interface EmergencyScenario {
  readonly slug: string;
  readonly urgency: UrgencyTier;
  readonly titleEn: string;
  readonly titleHi: string;
  /** Passed as marketplace search `q` */
  readonly lawyerSearchHint: string;
  readonly contextQuestions: readonly ContextQuestion[];
  readonly base: GuideSections;
}

export interface EmergencyScenarioSummary {
  readonly slug: string;
  readonly urgency: UrgencyTier;
  readonly titleEn: string;
  readonly titleHi: string;
  readonly lawyerSearchHint: string;
}
