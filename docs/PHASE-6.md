# Phase 6 — Legal Emergency Guide ("Kya Karein?")

**Goal (from [Jurisly.md](../Jurisly.md) §6 Phase 6):** Deliver scenario-driven legal emergency guidance with a safe fallback path when AI is unavailable.

## Blueprint features -> repo checklist

| Area           | Task                                               | Status | Notes / where                                                                                 |
| -------------- | -------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| Domain package | Scenario catalog, schemas, helpers                 | Done   | `packages/emergency-guide/src/*`                                                              |
| API            | List and fetch scenario guides                     | Done   | `packages/trpc/src/routers/emergency-guide.ts` (`list`, `bySlug`)                             |
| API            | Personalization with strict validation             | Done   | `packages/trpc/src/routers/emergency-guide.ts` (`personalize`)                                |
| AI fallback    | Deterministic non-AI fallback content              | Done   | `guideFromBase(...)` flow in emergency router + package helpers                               |
| Web            | Public guide list/detail experience                | Done   | `apps/web/src/app/[locale]/(marketing)/kya-karein/page.tsx`, `.../kya-karein/[slug]/page.tsx` |
| Safety text    | Legal information disclaimer attached to responses | Done   | `LEGAL_INFO_DISCLAIMER` in `@jurisly/emergency-guide` usage                                   |

## Architecture notes

- Personalization is input-validated against scenario constraints before model calls.
- If AI configuration or provider calls fail, the system intentionally returns curated baseline guidance.
- Emergency guide logic is isolated in a reusable package to avoid web/api duplication.

## Dependencies and runbook

1. Optional: configure OpenAI API key for AI-mode personalization.
2. Without API key, verify fallback mode and disclaimer behavior.
3. Validate localized pages through `/[locale]/kya-karein`.

## Out of scope in this phase

- Full multilingual content across all planned languages (expanded in Phase 14).
- Messaging channel distribution (WhatsApp in Phase 15).
