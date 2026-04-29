# Phase 7 — Document Vault

**Goal (from [KanuniBaat.md](../KanuniBaat.md) §6 Phase 7):** Provide a durable legal-document vault with upload, retrieval, and controlled sharing surfaces.

## Blueprint features -> repo checklist

| Area | Task | Status | Notes / where |
|------|------|--------|----------------|
| Schema | Vault document model and related indexes | Done | `packages/database/drizzle/0004_phase7_vault.sql`, `packages/database/src/schema/core.ts` |
| API | Vault CRUD + sharing procedures | Done | `packages/trpc/src/routers/vault.ts` |
| Web | Vault list, upload, and detail routes | Done | `apps/web/src/app/[locale]/app/vault/page.tsx`, `.../vault/upload/page.tsx`, `.../vault/[documentId]/page.tsx` |
| Web | Public shared-document route | Done | `apps/web/src/app/[locale]/(marketing)/vault/shared/[token]/page.tsx` |
| UX | Vault list integration in app surfaces | Done | App-shell pages and `vault-list` feature usage in web |
| E2EE maturity | Client-side encryption lifecycle hardening | Partial | Vault vertical exists; cryptographic UX and policy tightening can continue iteratively |

## Architecture notes

- Vault data model and sharing routes are independent from case-management documents.
- Locale-aware routing allows shared links and app pages to stay consistent with i18n boundaries.
- Vault is implemented as first-class app functionality, not an isolated admin feature.

## Dependencies and runbook

1. Apply migrations through current head.
2. Verify upload -> list -> open -> share token journey on web app routes.
3. Confirm access controls around shared tokens in non-owner sessions.

## Out of scope in this phase

- DigiLocker source ingestion and callback flow (Phase 15 integration track).
- Subscription-limit enforcement polish (Phase 13 monetization pass).
