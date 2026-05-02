# Phase 11 — Notifications + Case Tracker

**Goal (from [Jurisly.md](../Jurisly.md) §6 Phase 11):** Build proactive user/lawyer updates through notifications and public case-tracking surfaces.

## Blueprint features -> repo checklist

| Area             | Task                                           | Status  | Notes / where                                                            |
| ---------------- | ---------------------------------------------- | ------- | ------------------------------------------------------------------------ |
| Schema           | Notifications persistence                      | Done    | `packages/database/drizzle/0008_phase11_notifications.sql`               |
| Schema           | Case tracker persistence                       | Done    | `packages/database/drizzle/0009_phase11_case_tracker.sql`                |
| API              | Notifications procedures                       | Done    | `packages/trpc/src/routers/notifications.ts`                             |
| API              | Case tracker procedures                        | Done    | `packages/trpc/src/routers/case-tracker.ts`                              |
| Web              | Notifications app page                         | Done    | `apps/web/src/app/[locale]/app/notifications/page.tsx`                   |
| Web              | Public case tracker page                       | Done    | `apps/web/src/app/[locale]/(marketing)/case-tracker/page.tsx`            |
| Delivery breadth | Multi-channel delivery (push/SMS/email parity) | Partial | Domain model and API are in place; channel fan-out can continue evolving |

## Architecture notes

- Notification and case-tracker concerns are split by dedicated routers and migrations.
- Public case tracker is intentionally available under marketing routes.
- App notification inbox is isolated under authenticated app routes.

## Dependencies and runbook

1. Apply migrations.
2. Test `/[locale]/case-tracker` for public flow.
3. Test `/[locale]/app/notifications` with authenticated session data.

## Out of scope in this phase

- Community publishing and legal Q&A expansion (Phase 12).
- Revenue/subscription metrics as monetization KPIs (Phase 13).
