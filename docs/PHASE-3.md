# Phase 3 — Lawyer verification + marketplace

**Goal (from [KanuniBaat.md](../KanuniBaat.md) §6 Phase 3):** Lawyers can complete onboarding, pass verification, and be discovered by users on web and mobile.

Phase 2 left **`lawyer_profile`** as a draft-oriented row and **admin/lawyer API stubs** without marketplace UI. This phase builds the product flows and search on top of that foundation.

## Blueprint features → repo checklist

| Area | Task | Status | Notes / where |
|------|------|--------|----------------|
| Onboarding | Multi-step lawyer registration (web and/or mobile) | Pending | Extend `profile.createLawyerDraft` + new procedures as needed |
| Verification | Bar council / enrollment capture + document upload hooks | Pending | Schema may need new columns or `lawyer_document` table |
| Admin workflow | Queue for `pending` lawyers + approve/reject actions | Pending | Flesh out `admin.pendingLawyers` + mutations; UI can stay minimal in `apps/web` or target future `admin.*` |
| Public profile | Lawyer public profile page (slug or id) | Pending | New route(s) in `apps/web`, SEO metadata |
| Search | Meilisearch index + sync + filters | Pending | `MEILISEARCH_*` in `.env.example`; worker or API-triggered indexing |
| Discovery | Search/browse UI on web + mobile | Pending | Shared types in `@kb/types` or tRPC outputs |
| Availability | Lawyer scheduling model + API | Pending | New tables + `lawyer` procedures |

## Suggested sequencing (mergeable milestones)

1. **Schema** — verification fields, optional documents table, availability slots (or start with a minimal `availability` JSON on `lawyer_profile` for MVP).
2. **tRPC** — `lawyer.submitForReview`, `admin.approveLawyer` / `admin.rejectLawyer`, public `lawyer.getBySlug` / `lawyer.search` (backed by Meilisearch or Postgres-only MVP).
3. **Web** — onboarding wizard + public profile + search page.
4. **Mobile** — parity for discovery + profile view.
5. **Meilisearch** — index pipeline, env, failure modes (degrade to DB search if index down).

## Out of scope (later blueprint phases)

- Notice scanner (Phase 4), consultations + payments (Phase 5), emergency guide (Phase 6), document vault (Phase 7), etc.

## Dependencies

- Phase 2 complete: auth, `lawyer_profile`, roles, admin/lawyer guards.
- Configure `MEILISEARCH_URL` / `MEILISEARCH_MASTER_KEY` when enabling search (see root `.env.example`).
