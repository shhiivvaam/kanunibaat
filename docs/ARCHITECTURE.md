# KanuniBaat — Monorepo Architecture

This repository implements the **KanuniBaat** platform as a **pnpm + Turborepo** monorepo.

## Layout

| Path | Role |
|------|------|
| `apps/web` | Next.js (App Router) — marketing + authenticated web app, Better Auth routes, tRPC client |
| `apps/api` | NestJS — REST + **tRPC** HTTP adapter on `/trpc`, health checks |
| `apps/mobile` | Expo (Expo Router) — primary mobile client |
| `packages/config` | Shared Prettier, TypeScript base, ESLint patterns, Tailwind theme tokens |
| `packages/database` | Drizzle ORM + Postgres (`DATABASE_URL`), schema including **Better Auth** core tables |
| `packages/trpc` | `@kb/trpc` — shared `AppRouter` and procedures (imported by API + typed client) |
| `packages/api-client` | `@kb/api-client` — `createTRPCReact` instance + types for web/mobile |
| `packages/types` | Shared Zod enums / TS types |
| `packages/utils` | Shared formatters, constants, validators |
| `packages/ui` | Shared React (web) primitives |

## Data & auth

- **PostgreSQL** is accessed via **Drizzle** + `postgres` (Node). Use the Supabase **transaction pooler** connection string in production.
- **Better Auth** runs in **`apps/web`** (route handler `src/app/api/auth/[...all]/route.ts`) and uses the Drizzle adapter against the same schema as `@kb/database`.
- **Phase 2 — Core identity:** Domain tables `user_profile`, `user_role`, and `lawyer_profile` live beside Better Auth tables; Nest resolves **`session.token`** (Bearer and/or forwarded session cookie) to `authUserId` in tRPC context. Role checks are enforced in procedure middleware (`admin`, `lawyer`, `user`).
- **Phase 2 — Subdomain split:** Admin and lawyer **dashboard UIs** are **not** implemented in `apps/web`; they will target future hosts (e.g. `admin.*`, `lawyer.*`) and reuse the same API with CORS/Bearer/cookie rules described in [docs/adr/0002-phase2-auth-subdomains.md](./adr/0002-phase2-auth-subdomains.md).

## API surface

- **tRPC**: `POST/GET {API_URL}/trpc` (used by `@kb/api-client` from **mobile** and any direct API clients). The **web** app defaults to a **same-origin proxy** at `{NEXT_PUBLIC_APP_URL}/api/trpc` so Better Auth cookies are forwarded server-side.
- **Health**: `GET {API_URL}/health`
- **Waitlist**: tRPC procedures `waitlist.submitUser` and `waitlist.submitLawyer` (shared `@kb/waitlist` logic; Resend env vars on the API process).
- **Profile / RBAC (Phase 2):** `profile.me`, `profile.update`, `profile.createLawyerDraft`; admin stubs `admin.pendingLawyers`, `admin.listUsers` (guarded; no admin UI in this repo yet).

## Environment

See the repo root `.env.example`. Copy to `.env` locally; never commit secrets.

## Docs index

- [Phase 0 checklist](./PHASE-0.md) — foundation tasks and how they map to this repo.
- [Phase 1 checklist](./PHASE-1.md) — public website, waitlists, blog, SEO.
- [Phase 2 checklist](./PHASE-2.md) — auth, core API, OTP, mobile Bearer, ADR for subdomains.
- [Mobile auth & deep links](./MOBILE-AUTH-DEEPLINKS.md) — Expo token storage and deep-link strategy.
