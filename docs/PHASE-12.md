# Phase 12 — Content Platform + Legal Q&A

**Goal (from [KanuniBaat.md](../KanuniBaat.md) §6 Phase 12):** Ship trust-building legal content and Q&A workflows with both public discovery and app integration.

## Blueprint features -> repo checklist

| Area | Task | Status | Notes / where |
|------|------|--------|----------------|
| Schema | Content + Q&A persistence model | Done | `packages/database/drizzle/0010_phase12_content_qna.sql`, `packages/database/src/schema/core.ts` |
| API | Content router | Done | `packages/trpc/src/routers/content.ts` |
| API | Legal Q&A router | Done | `packages/trpc/src/routers/qa.ts` |
| Web | Public rights/content pages | Done | `apps/web/src/app/[locale]/(marketing)/rights/page.tsx`, `.../rights/[slug]/page.tsx`, `.../know-your-rights/page.tsx` |
| Web | Public Q&A list, detail, and ask pages | Done | `.../(marketing)/legal-qa/page.tsx`, `.../legal-qa/[questionId]/page.tsx`, `.../legal-qa/ask/page.tsx` |
| SEO/content depth | Editorial process and moderation maturity | Partial | Routing and API foundation exists; editorial workflow can continue hardening |

## Architecture notes

- Content and Q&A are separate routers to keep moderation/publication concerns decoupled.
- Public route-first implementation supports organic discovery and sharing.
- Database-backed models allow later analytics and recommendation overlays.

## Dependencies and runbook

1. Apply migrations.
2. Seed/insert content + QA records for end-to-end verification.
3. Verify browse -> detail -> ask flow on localized routes.

## Out of scope in this phase

- Subscription monetization and plan-limit gate enforcement (Phase 13).
- WhatsApp and DigiLocker integration channels (Phase 15).
