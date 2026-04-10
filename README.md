# KanuniBaat

Monorepo for **KanuniBaat** — legal infrastructure for India (web, API, mobile). Product name in UI may appear as KanooniBaat per branding; the repository and package namespace use **KanuniBaat**.

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Monorepo layout, auth, API boundaries |
| [docs/PHASE-0.md](./docs/PHASE-0.md) | Phase 0 foundation checklist and deployment notes |

## Prerequisites

- **Node.js** 22+
- **pnpm** 10+ (`npm i -g pnpm`)
- **PostgreSQL** (local or [Supabase](https://supabase.com/) Postgres URI)

## Quick start

```bash
cp .env.example .env
# Edit .env: set DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL / NEXT_PUBLIC_APP_URL

pnpm install
pnpm dev
```

- **Web:** http://localhost:3000 — Next.js App Router (`apps/web`)
- **API:** http://localhost:4000 — NestJS + tRPC on `/trpc` (`apps/api`, default `PORT=4000`)
- **Mobile:** Expo (`apps/mobile`)

`pnpm install` runs **`prepare`**, which builds all `packages/*` so workspace imports resolve.

## Scripts (root)

| Command | Description |
|---------|-------------|
| `pnpm dev` | Turborepo dev (all apps with a `dev` script) |
| `pnpm build` | Production build for apps + packages |
| `pnpm lint` | ESLint across workspaces |
| `pnpm typecheck` | TypeScript `tsc` across workspaces |
| `pnpm test` | Tests (where defined) |

## Workspace packages (`@kb/*`)

| Package | Role |
|---------|------|
| `@kb/config` | Shared TS/Prettier/Tailwind tokens |
| `@kb/database` | Drizzle + Postgres schema (incl. Better Auth tables) |
| `@kb/trpc` | Shared tRPC `AppRouter` |
| `@kb/api-client` | tRPC React client (`trpc` + React Query) |
| `@kb/types`, `@kb/utils`, `@kb/ui` | Shared types, utilities, UI primitives |

## Deployment (overview)

- **Web (Vercel):** set project root to `apps/web`; see `apps/web/vercel.json` and [docs/PHASE-0.md](./docs/PHASE-0.md).
- **API (Railway / Fly):** build Nest app, `node dist/main.js`; see `apps/api/railway.toml`.
- **Mobile (EAS):** `eas.json` in `apps/mobile`; configure bundle ID `com.kanooni.baat` in `app.json`.

## License

Private — all rights reserved unless otherwise stated.
