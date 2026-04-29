# Phase 13 — Subscriptions + Monetization

**Goal (from [KanuniBaat.md](../KanuniBaat.md) §6 Phase 13):** Introduce subscription plan tracking and monetization primitives across user and lawyer experiences.

## Blueprint features -> repo checklist

| Area | Task | Status | Notes / where |
|------|------|--------|----------------|
| Schema | Subscription and plan state persistence | Done | `packages/database/drizzle/0011_phase13_subscriptions.sql`, `packages/database/src/schema/core.ts` |
| API | Billing + subscription-aware procedures | Done | `packages/trpc/src/routers/billing.ts`, `packages/trpc/src/routers/practice-billing.ts` |
| Web | Billing app surface for users | Done | `apps/web/src/app/[locale]/app/billing/page.tsx` |
| Web | Lawyer invoice/billing settings flows | Done | `apps/web/src/app/[locale]/app/practice/invoices/page.tsx`, `.../billing-settings/page.tsx` |
| Integrations | Razorpay subscription integration foundation | Done | API env wiring and billing routes + phase-15 webhook hardening work |
| KPI depth | MRR/churn/LTV reporting completeness | Partial | Subscription primitives are in place; deeper finance analytics can iterate |

## Architecture notes

- Subscription state is persisted centrally in DB and consumed through billing routers.
- User and lawyer billing surfaces are intentionally separated by app route domains.
- Monetization builds on Phase 5 payment primitives rather than replacing them.

## Dependencies and runbook

1. Apply migrations.
2. Configure payment/subscription provider env values.
3. Validate active-plan state changes reflect in billing responses.

## Out of scope in this phase

- Full i18n rollout and locale-first app navigation consistency (Phase 14).
- WhatsApp and DigiLocker user acquisition/integration channels (Phase 15).
