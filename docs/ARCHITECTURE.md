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

## API surface

- **tRPC**: `POST/GET {API_URL}/trpc` (used by `@kb/api-client` from the web app). CORS allows the web origin via `CORS_ORIGIN`.
- **Health**: `GET {API_URL}/health`

## Environment

See the repo root `.env.example`. Copy to `.env` locally; never commit secrets.

## Docs index

- [Phase 0 checklist](./PHASE-0.md) — foundation tasks and how they map to this repo.
- [Phase 1 checklist](./PHASE-1.md) — public website, waitlists, blog, SEO.
