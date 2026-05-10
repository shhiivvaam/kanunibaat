/** Mirrors web marketing pages under `[locale]/(marketing)/*` — native summaries; legal text on web stays canonical at deploy time. */

export type MarketingPageCopy = {
  title: string;
  paragraphs: string[];
};

export const MARKETING_PAGES: Record<string, MarketingPageCopy> = {
  about: {
    title: 'About Jurisly',
    paragraphs: [
      'Jurisly is built for Indians who need clearer answers about law — from rental disputes to FIRs — without jargon gatekeeping.',
      'We combine verified advocates, cautious AI assistance, multilingual UX, encrypted document vaulting, Notice Scanner pipelines, emergency “Kya Karein?” playbooks, and practice tools for lawyers.',
      'The roadmap is Bharat-first privacy, audited workflows, and human review on anything that resembles advice rather than orientation.',
    ],
  },
  features: {
    title: 'Features',
    paragraphs: [
      'Notice Scanner — structured extraction, deadlines, and suggested next steps (not legal advice).',
      'Lawyer marketplace & consultations — verified profiles, bookings, continuity into practice tools.',
      'Encrypted vault — client-side envelopes before upload; optional DigiLocker import on web/mobile.',
      'Practice & billing — invoicing scaffolding for advocates; Research — judgments and drafting aides.',
      'Emergency guide (“Kya Karein?”), Know Your Rights articles, Legal Q&A, and case-tracking helpers.',
    ],
  },
  pricing: {
    title: 'Pricing',
    paragraphs: [
      'Citizen plans cover discovery, scanners, KYR modules, vault allocation, and consult credits where enabled.',
      'Lawyer / practice tiers unlock higher matter limits, integrations, branded intake, GST-ready billing exports, and team seats.',
      'Exact INR pricing rotates with pilots — check the deployed web pricing page before purchase; IAP may follow later on mobile storefronts.',
    ],
  },
  'for-lawyers': {
    title: 'For lawyers',
    paragraphs: [
      'Jurisly keeps client data encrypted-at-rest by design while giving you invoicing, research, consultations, vault delivery, and admin verification flows.',
      'Onboarding enforces enrollment + identity artifacts; admins approve before marketplace visibility.',
    ],
  },
  'lawyer-connect': {
    title: 'Lawyer connect',
    paragraphs: [
      'Find verified advocates filtered by geography, courts, languages, practice areas — then continue in encrypted chat or consultations.',
      'Prefer short briefs describing facts; nothing here replaces briefing counsel directly.',
    ],
  },
  'document-review': {
    title: 'Document review',
    paragraphs: [
      'Structured upload → risk flags → plain-language explainers referencing statutes where possible.',
      'Escalates to verified lawyers automatically when ambiguity or timelines demand human judgment.',
    ],
  },
  'know-your-rights': {
    title: 'Know your rights',
    paragraphs: [
      'Searchable bilingual explainers distilled from statutes and FAQs (not pleadings-ready without counsel).',
      'Use `/marketing/rights` for the in-app KYR explorer that mirrors web.',
    ],
  },
  'privacy-charter': {
    title: 'Privacy charter',
    paragraphs: [
      'We minimise data copied from DigiLocker, isolate tokens, purge scanner artifacts on policy timers, hash audit logs, and keep encryption keys solely on-device for vault payloads.',
      'SOC2-style backlog is tracked internally; DPIA artefacts available to enterprise pilots on request.',
    ],
  },
  terms: {
    title: 'Terms of use',
    paragraphs: [
      'Jurisly provides software and educational outputs — never a lawyer–client relationship by default.',
      'You must be 18+; prohibited uses include unauthorised scraping and automated bulk extraction beyond published API limits.',
      'Courts at Bengaluru retain exclusive jurisdiction unless superseded by a countersigned offline agreement.',
    ],
  },
  privacy: {
    title: 'Privacy policy',
    paragraphs: [
      'We describe categories processed (identifiers, uploads, telemetry), lawful bases where GDPR analogues matter, subprocessors hosting in India/APAC, retention windows, exporter rights, grievance escalation to our DPO desk within 72h.',
      'Marketing site cookies are minimal — session + analytics MVP; granular toggles arriving with CMP parity.',
    ],
  },
  waitlist: {
    title: 'App waitlist',
    paragraphs: [
      'Join early access cohorts — we prioritise multilingual regions and courts with brittle public data.',
      'Submit interest on web if a campaign slug is closed in-app — same backend waitlist ingestion.',
    ],
  },
  'waitlist-lawyer': {
    title: 'Lawyer waitlist',
    paragraphs: [
      'Practice teams get onboarded manually after AML + bar council artefacts pass admin review.',
      'Drop your chambers email + enrollment ID on the web portal to jump the invite queue.',
    ],
  },
};

export function getMarketingPage(slug: unknown): MarketingPageCopy | null {
  if (typeof slug !== 'string') return null;
  return MARKETING_PAGES[slug] ?? null;
}
