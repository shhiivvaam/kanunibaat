# Phase 4 — Notice Scanner

**Goal (from [Jurisly.md](../Jurisly.md) §6 Phase 4):** Ship the viral notice-scanner flow with upload, OCR/AI analysis pipeline, and user-facing result surfaces.

## Blueprint features -> repo checklist

| Area         | Task                                                | Status  | Notes / where                                                                                                  |
| ------------ | --------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| Schema       | Notice scan persistence tables and enums            | Done    | `packages/database/drizzle/0002_phase4_notice_scanner.sql`, `packages/database/src/schema/core.ts`             |
| API          | Public scanner endpoints in tRPC                    | Done    | `packages/trpc/src/routers/notices.ts`                                                                         |
| AI pipeline  | AI-backed notice interpretation + structured output | Done    | `packages/trpc/src/notices/*`, API wiring in notice router                                                     |
| Web          | Scanner input + result page                         | Done    | `apps/web/src/app/[locale]/(marketing)/notice-scanner/page.tsx`, `.../notice-scanner/result/[scanId]/page.tsx` |
| Product link | "Talk to lawyer" continuation path from result      | Done    | Scanner result + marketplace routes under `[locale]` app                                                       |
| Limits       | Plan limits integration hooks                       | Partial | Data model/procedures exist; enforcement evolves with billing/subscriptions layers                             |

## Architecture notes

- Scanner is exposed as an app capability, not only a backend primitive.
- Result rendering is route-based and locale-aware through `[locale]` routing.
- The scanner data model is the source of truth for replays/history and downstream actions.

## Dependencies and runbook

1. Apply migration set through current head (`pnpm --filter @jurisly/database db:migrate`).
2. Ensure AI provider env is configured for full analysis behavior.
3. Use web route `/[locale]/notice-scanner` for smoke verification.

## Out of scope in this phase

- Full monetization policy and strict feature gating behavior (covered as subscriptions matured in later phases).
- WhatsApp ingestion and external document source ingestion (Phase 15+).
