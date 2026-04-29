# Phase 10 — Practice Analytics + Billing

**Goal (from [KanuniBaat.md](../KanuniBaat.md) §6 Phase 10):** Provide lawyers with operational analytics and invoice/billing workflows on top of the case/practice base.

## Blueprint features -> repo checklist

| Area | Task | Status | Notes / where |
|------|------|--------|----------------|
| Schema | Practice billing/analytics persistence layer | Done | `packages/database/drizzle/0007_phase10_practice_billing.sql`, `packages/database/src/schema/core.ts` |
| API | Billing router surface | Done | `packages/trpc/src/routers/billing.ts` |
| API | Analytics/billing helpers in practice routers | Done | `packages/trpc/src/routers/practice-analytics.ts`, `packages/trpc/src/routers/practice-billing.ts` |
| Web | Analytics page | Done | `apps/web/src/app/[locale]/app/practice/analytics/page.tsx` |
| Web | Billing settings and invoices pages | Done | `.../app/practice/billing-settings/page.tsx`, `.../app/practice/invoices/page.tsx`, `.../app/practice/invoices/[invoiceId]/page.tsx` |
| Reporting depth | Advanced exports and long-window business reporting | Partial | Core app routes and APIs exist; advanced reporting can iterate |

## Architecture notes

- Billing and analytics are kept as practice concerns rather than generic user billing.
- Invoice route segmentation supports both list and per-invoice detail views.
- Router split (`billing`, `practice-analytics`, `practice-billing`) keeps long-term ownership clear.

## Dependencies and runbook

1. Apply migrations.
2. Validate lawyer role access for practice billing pages.
3. Smoke test analytics summaries and invoice detail rendering.

## Out of scope in this phase

- Push-notification case reminder orchestration (Phase 11).
- Subscription plan governance and hard feature gates (Phase 13).
