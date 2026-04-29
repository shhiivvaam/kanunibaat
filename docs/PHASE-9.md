# Phase 9 — AI Legal Research Engine

**Goal (from [KanuniBaat.md](../KanuniBaat.md) §6 Phase 9):** Enable legal research and drafting-assist workflows for lawyers through structured API and app routes.

## Blueprint features -> repo checklist

| Area | Task | Status | Notes / where |
|------|------|--------|----------------|
| Schema | Research-oriented persistence tables | Done | `packages/database/drizzle/0006_phase9_ai_legal_research.sql`, `packages/database/src/schema/core.ts` |
| API | Research router and query workflows | Done | `packages/trpc/src/routers/research.ts` |
| Web | Research home and judgments routes | Done | `apps/web/src/app/[locale]/app/research/page.tsx`, `.../research/judgments/page.tsx`, `.../research/judgments/[judgmentId]/page.tsx` |
| Web | Drafting and mapper routes | Done | `.../research/drafting/page.tsx`, `.../research/mapper/page.tsx`, `.../research/library/page.tsx` |
| Integration | Shared search + AI service collaboration | Done | `@kb/search` usage in API/trpc stack |
| Corpus maturity | Full external corpus and citation-graph depth | Partial | Core routing and data model are shipped; corpus expansion remains ongoing |

## Architecture notes

- Research functionality is isolated as its own router to preserve separation from marketplace/search flows.
- Route structure supports modular expansion (judgments, drafting, mapper, library) without rewiring auth boundaries.
- AI-assisted workflows degrade gracefully when optional providers are unavailable.

## Dependencies and runbook

1. Configure AI + search env variables for full functionality.
2. Verify authenticated navigation to `/[locale]/app/research/*`.
3. Smoke test search query, result listing, detail load, and drafting page.

## Out of scope in this phase

- Practice revenue analytics and invoicing (Phase 10).
- Community content and Q&A publication workflows (Phase 12).
