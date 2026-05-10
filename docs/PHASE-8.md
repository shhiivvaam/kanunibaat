# Phase 8 — Lawyer Case Management Suite

**Goal (from [Jurisly.md](../Jurisly.md) §6 Phase 8):** Ship core case-management workflows for lawyers: case records, hearings, task surfaces, and client context.

## Blueprint features -> repo checklist

| Area            | Task                                 | Status  | Notes / where                                                                                                    |
| --------------- | ------------------------------------ | ------- | ---------------------------------------------------------------------------------------------------------------- |
| Schema          | Case-management tables and relations | Done    | `packages/database/drizzle/0005_phase8_lawyer_case_management.sql`, `packages/database/src/schema/core.ts`       |
| API             | Case CRUD and workflow procedures    | Done    | `packages/trpc/src/routers/cases.ts`, `packages/trpc/src/routers/practice.ts`                                    |
| API             | Lawyer practice composition router   | Done    | `packages/trpc/src/routers/practice.ts`                                                                          |
| Web             | Practice case list/new/detail pages  | Done    | `apps/web/src/app/[locale]/app/practice/cases/page.tsx`, `.../cases/new/page.tsx`, `.../cases/[caseId]/page.tsx` |
| Web             | Practice app shell entry points      | Done    | `apps/web/src/app/[locale]/app/practice/page.tsx`                                                                |
| NJDG sync depth | External court tracker automation    | Partial | Case-tracker support is available and expanded in Phase 11                                                       |

## Architecture notes

- Case and practice APIs are separated from user consultation APIs to keep domain boundaries clear.
- UI and API are aligned around `/app/practice/*` routes for lawyer workflows.
- The schema supports lifecycle and audit-friendly updates for long-running case records.

## Dependencies and runbook

1. Apply DB migrations.
2. Ensure lawyer-authenticated session for `/[locale]/app/practice/cases`.
3. Validate create -> update -> view flow for cases and timeline data.

## Out of scope in this phase

- Research engine authoring workflows (Phase 9).
- Practice analytics and invoice deep workflows (Phase 10).
