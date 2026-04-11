# Phase 2 — Auth + core API

**Goal:** Better Auth on web (shared Postgres with Nest), session-aware tRPC, core profile/roles/lawyer tables, OTP delivery (email via Resend, SMS via MSG91), mobile Bearer path, and documentation for future subdomain apps.

This checklist maps to [KanuniBaat.md](../KanuniBaat.md) §6 (Phase 2) and the Phase 2 implementation plan. Status is tracked at a high level; adjust cells as work lands.

## Checklist

| Milestone | Task | Status | Where / notes |
|-----------|------|--------|----------------|
| Docs | Phase 2 checklist + env notes | Done | This file |
| Docs | ADR: cookies, CORS, Bearer vs cookie, Nest session validation | Done | [docs/adr/0002-phase2-auth-subdomains.md](./adr/0002-phase2-auth-subdomains.md) |
| Docs | Architecture overview updated for Phase 2 | Done | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| DB | `user_profile`, `user_role`, `lawyer_profile` + enums | Done | `packages/database/src/schema/core.ts`, `packages/database/drizzle/` |
| Web | Email/password sign-in, sign-up, sign-out (Better Auth client) | Done | `apps/web/src/features/marketing/auth-modal.tsx`, `apps/web/src/lib/auth-client.ts` |
| Web | Authenticated `/app` shell (server session gate) | Done | `apps/web/src/app/app/` |
| Web | tRPC same-origin proxy (session cookies → API) | Done | `apps/web/src/app/api/trpc/[[...path]]/route.ts`, `apps/web/src/components/providers.tsx` |
| API | Resolve session from Bearer + Better Auth session cookie | Done | `packages/trpc/src/context.ts`, `packages/trpc/src/session-resolve.ts` |
| API | `protectedProcedure`, role guards, `profile.*`, `admin.*` stubs | Done | `packages/trpc/src/router.ts`, `packages/trpc/src/routers/*` |
| OTP | Email OTP (Better Auth `email-otp` + Resend) | Done | `apps/web/src/lib/auth.ts`, `apps/web/src/lib/email-otp-delivery.ts` |
| OTP | Phone OTP (Better Auth `phone-number` + MSG91) + throttling | Done | `apps/web/src/lib/msg91-otp.ts`, `apps/web/src/lib/otp-rate-limit.ts` |
| Mobile | Secure session token + `Authorization: Bearer` on tRPC | Done | `apps/mobile/components/TrpcProvider.tsx`, `apps/mobile/lib/auth-token.ts` |
| Mobile | Deep-link strategy (documented) | Done | [docs/MOBILE-AUTH-DEEPLINKS.md](./MOBILE-AUTH-DEEPLINKS.md) |
| API | Swagger on REST surface | Done | `apps/api/src/main.ts`, controllers |
| Tests | Session token parsing + profile/admin procedure behaviour | Done | `packages/trpc/src/*.spec.ts`, `apps/api/src/*.spec.ts` |

## Explicitly not in this phase

| Item | Note |
|------|------|
| Admin dashboard UI | Future host on `admin.*` (or similar); this phase only exposes guarded API stubs. |
| Lawyer marketplace / verification UI | Phase 3+; schema + `lawyer_profile` + API hooks only here. |
| Supabase RLS as auth boundary | Not assumed; API uses service DB role. Documented in ADR. |

## Environment

See repo root `.env.example`. Phase 2 additions worth calling out:

- **`INTERNAL_API_URL`** (optional on web): server-side tRPC proxy target; defaults to `NEXT_PUBLIC_API_URL`.
- **`BETTER_AUTH_SECRET`**: set on **both** `apps/web` and `apps/api` (Nest uses it to unsign forwarded session cookies).
- **`BETTER_AUTH_*`**, **`DATABASE_URL`**, **`CORS_ORIGIN`**, **`RESEND_API_KEY`**, **`MSG91_*`**.

## Database migrations

From repo root (with `DATABASE_URL` set):

```bash
pnpm --filter @kb/database db:generate
pnpm --filter @kb/database db:migrate
```

For local iteration without migration files, `pnpm --filter @kb/database db:push` remains available (see [PHASE-0.md](./PHASE-0.md)).

If you already applied schemas with `db:push` before this migration existed, resolve drift with a manual diff or a Drizzle baseline workflow before running `db:migrate` against production data.
