# Phase 3 — Lawyer verification + marketplace

**Goal (from [Jurisly.md](../Jurisly.md) §6 Phase 3):** Lawyers can complete onboarding (including **required documents**), pass admin verification, and be discovered via **Meilisearch with mandatory Postgres fallback** if the index is down or unset.

Phase 2 left **`lawyer_profile`** as draft-oriented and admin stubs without marketplace UI. This phase completes the vertical slice: **Postgres source of truth**, **S3-backed document keys** (presigned upload; AWS env when you enable it), **Meili as an acceleration layer**, **never optional search**.

## Blueprint features → repo checklist

| Area           | Task                                                                        | Status | Notes / where                                                                                                                                                                          |
| -------------- | --------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schema         | `lawyer_document` table (required), availability, extended `lawyer_profile` | Done   | [`packages/database/src/schema/core.ts`](../packages/database/src/schema/core.ts); migration [`0001_phase3_marketplace.sql`](../packages/database/drizzle/0001_phase3_marketplace.sql) |
| Storage        | S3 presign package; validate AWS env at upload time                         | Done   | [`packages/storage`](../packages/storage); `lawyer.requestDocumentUpload`                                                                                                              |
| Onboarding     | Multi-step flow + document upload step                                      | Done   | `lawyer.*` tRPC; web [`/app/lawyer/onboarding`](../apps/web/src/app/[locale]/app/lawyer/onboarding/page.tsx)                                                                           |
| Verification   | Required docs before `submitForReview`; admin sees doc metadata             | Done   | [`lawyer-documents.ts`](../packages/trpc/src/lawyer-documents.ts); `admin.pendingLawyers`                                                                                              |
| Admin workflow | Queue + approve/reject + view pending docs                                  | Done   | `admin.*`; web [`/app/admin`](../apps/web/src/app/[locale]/app/admin/page.tsx) + RSC layout gate                                                                                       |
| Public profile | Page by `slug`, SEO                                                         | Done   | [`[locale]/(marketing)/lawyers/[slug]`](<../apps/web/src/app/[locale]/(marketing)/lawyers/[slug]/page.tsx>)                                                                            |
| Search         | Meilisearch index + sync + **Postgres fallback (same DTO)**                 | Done   | [`packages/search`](../packages/search) (`meili-http` + `postgres-search`); `marketplace.searchLawyers`                                                                                |
| Discovery      | Web + mobile list/detail                                                    | Done   | `marketplace.*`; web `/lawyers`; mobile `(tabs)/lawyers`                                                                                                                               |
| Availability   | Table + API                                                                 | Done   | `lawyer.listAvailability` / `lawyer.setAvailability`                                                                                                                                   |

## Architecture notes

- **`lawyer_document` is not optional** — onboarding cannot reach `pending` without required kinds (`enrollment_certificate`, `government_id`), each with at least one row where `uploaded_at` is set.
- **`marketplace.searchLawyers`** tries Meilisearch via HTTP; on any error or missing URL, runs **Postgres** search so users always get results when verified lawyers exist (same `MarketplaceLawyerHit` shape).
- **S3 credentials** can be added later; until then, `lawyer.requestDocumentUpload` returns **412-style** `PRECONDITION_FAILED` with a clear message.
- **Meilisearch** uses a small **fetch-based** client (no ESM-only SDK) to stay compatible with the Nest/tRPC CJS build.

## Runbook

1. Apply DB migration: `pnpm --filter @jurisly/database db:migrate` (requires `DATABASE_URL`).
2. Optional Meili: set `MEILISEARCH_URL` (+ `MEILISEARCH_MASTER_KEY` if required); optional `MEILISEARCH_INDEX_LAWYERS` (default `lawyers`). Create the index in Meili or let first upsert run; configure **searchable** attributes as needed for your Meili version.
3. Optional uploads: set `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`.

## Out of scope (later blueprint phases)

- Notice scanner (Phase 4), consultations + payments (Phase 5), emergency guide (Phase 6), document vault (Phase 7), etc.

## Dependencies

- Phase 2: auth, `lawyer_profile`, roles, admin/lawyer guards.
- `MEILISEARCH_URL` / `MEILISEARCH_MASTER_KEY` for fast search; search still works without them via Postgres.
- `AWS_*` + `AWS_S3_BUCKET` when enabling real uploads (see root `.env.example`).
