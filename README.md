# KanuniBaat

Monorepo for **KanuniBaat** — legal infrastructure for India (web, API, mobile). Product name in UI may appear as KanooniBaat per branding; the repository and package namespace use **KanuniBaat**.

## Documentation

| Doc | Purpose |
|-----|---------|
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Monorepo layout, auth, API boundaries |
| [docs/ONBOARDING.md](./docs/ONBOARDING.md) | First-day setup and orientation for new devs/agents |
| [docs/PROJECT-FLOWS.md](./docs/PROJECT-FLOWS.md) | End-to-end business and technical flow map |
| [docs/API-SURFACE.md](./docs/API-SURFACE.md) | API entry points, tRPC router map, webhook/internal endpoints |
| [docs/PHASE-0.md](./docs/PHASE-0.md) | Phase 0 foundation checklist and deployment notes |
| [docs/PHASE-1.md](./docs/PHASE-1.md) | Phase 1 marketing site, waitlists, legal pages, SEO |
| [docs/PHASE-2.md](./docs/PHASE-2.md) | Phase 2 auth, sessions, profile/role API, OTP |
| [docs/PHASE-3.md](./docs/PHASE-3.md) | Phase 3 lawyer verification and marketplace |
| [docs/PHASE-4.md](./docs/PHASE-4.md) | Phase 4 notice scanner |
| [docs/PHASE-5.md](./docs/PHASE-5.md) | Phase 5 consultations and payments |
| [docs/PHASE-6.md](./docs/PHASE-6.md) | Phase 6 emergency guide ("Kya Karein?") |
| [docs/PHASE-7.md](./docs/PHASE-7.md) | Phase 7 document vault |
| [docs/PHASE-8.md](./docs/PHASE-8.md) | Phase 8 lawyer case management |
| [docs/PHASE-9.md](./docs/PHASE-9.md) | Phase 9 AI legal research |
| [docs/PHASE-10.md](./docs/PHASE-10.md) | Phase 10 practice analytics and billing |
| [docs/PHASE-11.md](./docs/PHASE-11.md) | Phase 11 notifications and case tracker |
| [docs/PHASE-12.md](./docs/PHASE-12.md) | Phase 12 content platform and legal Q&A |
| [docs/PHASE-13.md](./docs/PHASE-13.md) | Phase 13 subscriptions and monetization |
| [docs/PHASE-14.md](./docs/PHASE-14.md) | Phase 14 i18n and vernacular rollout |
| [docs/MOBILE-AUTH-DEEPLINKS.md](./docs/MOBILE-AUTH-DEEPLINKS.md) | Mobile auth token and deep-link behavior notes |

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
- **API:** http://localhost:4000 — NestJS + tRPC on `/trpc` (`apps/api`, default `PORT=4000`). Waitlist forms call this API; start it alongside the web app for local testing.
- **Mobile:** Expo (`apps/mobile`) — set `EXPO_PUBLIC_API_URL` to your API base URL (see `.env.example`).

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
| `@kb/types`, `@kb/utils`, `@kb/ui`, `@kb/waitlist` | Shared types, utilities, UI primitives, waitlist email logic |

## Deployment (overview)

- **Web (Vercel):** set project root to `apps/web`; see `apps/web/vercel.json` and [docs/PHASE-0.md](./docs/PHASE-0.md).
- **API (Railway / Fly):** build Nest app, `node dist/main.js`; see `apps/api/railway.toml`.
- **Mobile (EAS):** `eas.json` in `apps/mobile`; configure bundle ID `com.kanooni.baat` in `app.json`.

## App-level docs

- `apps/web/README.md`
- `apps/api/README.md`
- `apps/mobile/README.md`

## License

Private — all rights reserved unless otherwise stated.
