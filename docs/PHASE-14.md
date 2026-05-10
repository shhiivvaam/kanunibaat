# Phase 14 — i18n + Vernacular

**Goal (from [Jurisly.md](../Jurisly.md) §6 Phase 14):** Make the platform locale-first with consistent language routing and message catalogs for priority Indian languages.

## Blueprint features -> repo checklist

| Area               | Task                                      | Status  | Notes / where                                                                                                |
| ------------------ | ----------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| Locale routing     | Route-level locale segmenting             | Done    | `apps/web/src/app/[locale]/...` route tree                                                                   |
| Config             | Locale registry + default and RTL toggles | Done    | `apps/web/src/i18n/routing.ts`                                                                               |
| Messages           | Message catalogs for priority languages   | Done    | `apps/web/src/messages/en.json`, `hi.json`, `ta.json`, `te.json`, `kn.json`, `mr.json`, `gu.json`, `bn.json` |
| Runtime            | Request-time locale message loading       | Done    | `apps/web/src/i18n/request.ts`                                                                               |
| Coverage           | Marketing + app pages under locale scope  | Done    | Major marketing/app pages now live under `[locale]`                                                          |
| RTL productization | Full RTL QA and visual support rollout    | Partial | Runtime toggle exists; full UI-level RTL pass is optional/flagged                                            |

## Architecture notes

- The app uses locale-prefixed routes for deterministic navigation and SEO alignment.
- Message loading is centralized and validated against a known locale set.
- RTL behavior is feature-flagged to avoid accidental regressions before full QA.

## Dependencies and runbook

1. Set locale-aware app URLs for verification (`/[locale]/...` routes).
2. Verify fallback to default locale for unsupported locale keys.
3. Validate at least one complete journey in each shipped language catalog.

## Out of scope in this phase

- Channel integrations (WhatsApp bot, DigiLocker callback handling) in Phase 15.
