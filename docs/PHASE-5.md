# Phase 5 — Consultation Flow + Payments

**Goal (from [Jurisly.md](../Jurisly.md) §6 Phase 5):** Allow users to book consultations and execute payment flows with reliable backend accounting.

## Blueprint features -> repo checklist

| Area              | Task                                   | Status  | Notes / where                                                                                              |
| ----------------- | -------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------- |
| Schema            | Consultation and payment domain tables | Done    | `packages/database/drizzle/0003_phase5_consultations_payments.sql`, `packages/database/src/schema/core.ts` |
| API               | Consultation lifecycle procedures      | Done    | `packages/trpc/src/routers/consultations.ts`                                                               |
| API               | Payment/billing procedure surfaces     | Done    | `packages/trpc/src/routers/billing.ts`                                                                     |
| Web               | Consultation booking and session pages | Done    | `apps/web/src/app/[locale]/app/consultations/book/page.tsx`, `.../consultations/[consultationId]/page.tsx` |
| Web               | Billing page for app users             | Done    | `apps/web/src/app/[locale]/app/billing/page.tsx`                                                           |
| Webhook hardening | Payment webhook reliability coverage   | Partial | Razorpay webhook tests and phase-15 bridge work are in progress in API changes                             |

## Architecture notes

- Payment concerns are split from consultation orchestration via dedicated routers.
- Consultation UI is fully localized route-first under `[locale]/app/consultations`.
- Billing and subscription integrations are layered so later phases can gate features without rewriting consultation flows.

## Dependencies and runbook

1. Configure Razorpay keys and webhook secret in environment.
2. Ensure API and web point to the same DB + auth session source.
3. Smoke test booking -> payment -> consultation view transitions.

## Out of scope in this phase

- Advanced practice analytics and invoicing (Phase 10).
- WhatsApp-first booking entry points (Phase 15).
