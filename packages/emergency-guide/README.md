# @kb/emergency-guide

Curated **Kya Karein?** (Legal Emergency Guide) scenarios for KanuniBaat Phase 6.

## Editing scenarios

- Source of truth: [`src/scenarios-data.ts`](src/scenarios-data.ts)
- Each scenario has bilingual titles (`titleEn` / `titleHi`), an urgency tier, `lawyerSearchHint` (used as the marketplace search query), `contextQuestions` (ids used as keys in `personalize` answers), and `base` sections shown before or without AI personalisation.
- Keep language **informational**, not case-specific legal advice. Major changes should be reviewed like legal copy.

## Build

This package is consumed by `@kb/trpc`. Run `pnpm --filter @kb/emergency-guide build` (or root `pnpm build`) after edits.

`src/indian-states.ts` duplicates `@kb/utils` state codes to avoid CJS/ESM interop in the build graph; keep it aligned when the master list changes.
