import { z } from 'zod';

/** Structured guide returned by AI or built from base content (fallback). */
export const personalizedGuideSchema = z.object({
  right_now: z.array(z.string().min(1).max(800)).min(1).max(12),
  your_rights: z.array(z.string().min(1).max(800)).min(1).max(12),
  documents: z.array(z.string().min(1).max(800)).min(1).max(12),
  what_not_to_do: z.array(z.string().min(1).max(800)).min(1).max(12),
  police_or_court: z.array(z.string().min(1).max(800)).min(1).max(12),
  timeline: z.array(z.string().min(1).max(800)).min(1).max(10),
  applicable_laws: z.array(z.string().min(1).max(400)).min(1).max(12),
});

export type PersonalizedGuide = z.infer<typeof personalizedGuideSchema>;

export const LEGAL_INFO_DISCLAIMER =
  'This is general legal information, not advice for your specific case. Consult a verified advocate for guidance tailored to your facts.';
