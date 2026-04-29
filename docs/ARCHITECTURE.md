# KanuniBaat — Architecture

KanuniBaat is a **pnpm + Turborepo monorepo** with a shared type-safe API contract, a Postgres/Drizzle data layer, and product surfaces across web, mobile, and backend integrations.

## System overview

| Layer | Primary stack | Responsibility |
|------|------|------|
| Web app | Next.js App Router (`apps/web`) | Marketing + authenticated app surfaces, Better Auth host, locale-routed UI |
| API app | NestJS (`apps/api`) | Public HTTP stack, `/trpc` adapter, webhooks, internal cron endpoints |
| Mobile app | Expo Router (`apps/mobile`) | Mobile-first product surface using shared tRPC contract |
| Shared API | `@kb/trpc` (`packages/trpc`) | Domain routers, RBAC procedures, integration glue |
| Database | Drizzle + PostgreSQL (`packages/database`) | Schema + migrations for product domains |
| Shared clients/types | `@kb/api-client`, `@kb/types`, `@kb/utils` | Typed API client, domain constants/schemas, reusable utilities |

## Monorepo topology

- `apps/web`: locale-prefixed routes in `src/app/[locale]` for marketing and `/app` surfaces.
- `apps/api`: Nest bootstrap + Express middleware stack for tRPC and webhook endpoints.
- `apps/mobile`: Expo app with typed API access through shared packages.
- `packages/database`: single source of truth for schema + migrations.
- `packages/trpc`: domain routers including marketplace, notices, consultations, vault, cases, research, notifications, case tracker, content/QA, billing, integrations.
- `packages/emergency-guide`: curated scenario catalog and personalization contracts.

## Request and data flow

1. Client calls web proxy (`/api/trpc`) or API (`/trpc`) directly.
2. API resolves auth session into `authUserId` using Bearer/session token context.
3. Router-level RBAC middleware (`public`, `protected`, role-gated procedures) authorizes access.
4. Domain procedure reads/writes Postgres via Drizzle.
5. Optional integration calls run (Meili, S3, OCR/AI, Razorpay, LiveKit, WhatsApp, DigiLocker).
6. Typed response returns to web/mobile through shared `AppRouter`.

## Auth and identity model

- Better Auth is hosted in web route handlers and persists against shared Postgres tables.
- API trusts validated session context and exposes role-protected procedures.
- Core identity domain includes user profile + role assignment + lawyer profile lifecycle.
- Lawyer/admin routes are implemented in-product under locale app routes; future host split remains possible via CORS/token strategy in ADR.

## Integration surfaces (current)

- **Search**: Meilisearch for lawyers and judgments with database fallback paths in domain flows.
- **Storage**: S3 document flows for uploads and vault/case document patterns.
- **AI/OCR**: OpenAI/vision-backed analysis routes with fallback behavior where configured.
- **Payments**: Razorpay orders/subscriptions plus webhook endpoints.
- **Realtime/media**: LiveKit credential wiring for consultation sessions.
- **Notifications/case polling**: internal secured endpoints for dispatch and polling jobs.
- **Channels**: WhatsApp webhook endpoint and DigiLocker integration router.

## Public HTTP surfaces (API app)

- `GET /health` - health check.
- `GET/POST /trpc` - shared tRPC API.
- `POST /webhooks/razorpay` - payment webhook.
- `POST /webhooks/razorpay/subscriptions` - subscription webhook.
- `GET /webhooks/whatsapp` - webhook verification challenge.
- `POST /webhooks/whatsapp` - inbound WhatsApp events.
- `POST /internal/notifications/dispatch` - internal notifier job.
- `POST /internal/case-tracker/poll` - internal case tracker polling job.

## Data domains covered through Phase 14

- Marketing + waitlist intake
- Auth/profile/role and lawyer onboarding
- Lawyer marketplace and public profiles
- Notice scanner and analysis result flows
- Consultations and payment foundations
- Emergency guide scenario personalization
- Document vault and shared access links
- Lawyer practice/case management
- Legal research and drafting workflow surfaces
- Practice analytics and invoicing
- Notifications and case tracking
- Rights/content/QA platform
- Subscription state and monetization paths
- Locale-first routing with 8 language catalogs

## Configuration model

- Runtime environment is validated in API at startup (`apps/api/src/env.ts`).
- `.env.example` is the canonical config contract for local/staging/prod parity.
- Sensitive integration values remain environment-only.

## Related docs

- [Onboarding guide](./ONBOARDING.md)
- [Project flows](./PROJECT-FLOWS.md)
- [API surface](./API-SURFACE.md)
- [Mobile auth & deep links](./MOBILE-AUTH-DEEPLINKS.md)
- [Phase docs (`PHASE-0` to `PHASE-14`)](../README.md)
