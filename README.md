# Jurisly

Monorepo for **Jurisly** — legal infrastructure for India (web, API, mobile). Product name in UI may appear as Jurisly per branding; the repository and package namespace use **Jurisly**.

## Documentation

| Doc                                                              | Purpose                                                        |
| ---------------------------------------------------------------- | -------------------------------------------------------------- |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)                   | Monorepo layout, auth, API boundaries                          |
| [docs/ONBOARDING.md](./docs/ONBOARDING.md)                       | First-day setup and orientation for new devs/agents            |
| [docs/PROJECT-FLOWS.md](./docs/PROJECT-FLOWS.md)                 | End-to-end business and technical flow map                     |
| [docs/API-SURFACE.md](./docs/API-SURFACE.md)                     | API entry points, tRPC router map, webhook/internal endpoints  |
| [docs/PHASE-0.md](./docs/PHASE-0.md)                             | Phase 0 foundation checklist and deployment notes              |
| [docs/PHASE-1.md](./docs/PHASE-1.md)                             | Phase 1 marketing site, waitlists, legal pages, SEO            |
| [docs/PHASE-2.md](./docs/PHASE-2.md)                             | Phase 2 auth, sessions, profile/role API, OTP                  |
| [docs/PHASE-3.md](./docs/PHASE-3.md)                             | Phase 3 lawyer verification and marketplace                    |
| [docs/PHASE-4.md](./docs/PHASE-4.md)                             | Phase 4 notice scanner                                         |
| [docs/PHASE-5.md](./docs/PHASE-5.md)                             | Phase 5 consultations and payments                             |
| [docs/PHASE-6.md](./docs/PHASE-6.md)                             | Phase 6 emergency guide ("Kya Karein?")                        |
| [docs/PHASE-7.md](./docs/PHASE-7.md)                             | Phase 7 document vault                                         |
| [docs/PHASE-8.md](./docs/PHASE-8.md)                             | Phase 8 lawyer case management                                 |
| [docs/PHASE-9.md](./docs/PHASE-9.md)                             | Phase 9 AI legal research                                      |
| [docs/PHASE-10.md](./docs/PHASE-10.md)                           | Phase 10 practice analytics and billing                        |
| [docs/PHASE-11.md](./docs/PHASE-11.md)                           | Phase 11 notifications and case tracker                        |
| [docs/PHASE-12.md](./docs/PHASE-12.md)                           | Phase 12 content platform and legal Q&A                        |
| [docs/PHASE-13.md](./docs/PHASE-13.md)                           | Phase 13 subscriptions and monetization                        |
| [docs/PHASE-14.md](./docs/PHASE-14.md)                           | Phase 14 i18n and vernacular rollout                           |
| [docs/MOBILE-AUTH-DEEPLINKS.md](./docs/MOBILE-AUTH-DEEPLINKS.md) | Mobile auth token and deep-link behavior notes                 |
| [docs/DEPLOYMENT-FREE-TIER.md](./docs/DEPLOYMENT-FREE-TIER.md)   | Vercel + Render + Supabase + Upstash (free-tier checklist)     |
| [docs/DEPLOYMENT-PRODUCTION.md](./docs/DEPLOYMENT-PRODUCTION.md) | Production-only URLs, auth/CORS pairing, optional deploy hooks |

## Prerequisites

- **Node.js** 22+
- **pnpm** 10+ — one-time: `corepack enable && corepack prepare pnpm@10.33.0 --activate`, or `npm i -g pnpm`; the repo also lists `pnpm` as a devDependency so **after** the first `pnpm install`, hooks use `node_modules/.bin/pnpm`.
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

`pnpm install` runs **`prepare`**, which builds all `packages/*` so workspace imports resolve, and **installs Git hooks (Husky)** so `git commit` / `git push` run **`pnpm verify`** automatically. Use a normal install (do not pass `--ignore-scripts`). See [docs/ONBOARDING.md](./docs/ONBOARDING.md).

## Scripts (root)

| Command             | Description                                                                            |
| ------------------- | -------------------------------------------------------------------------------------- |
| `pnpm dev`          | Turborepo dev (all apps with a `dev` script)                                           |
| `pnpm build`        | Production build for apps + packages                                                   |
| `pnpm lint`         | ESLint across workspaces                                                               |
| `pnpm typecheck`    | TypeScript `tsc` across workspaces                                                     |
| `pnpm test`         | Tests (where defined)                                                                  |
| `pnpm format:check` | Prettier check (also part of `pnpm verify`)                                            |
| `pnpm verify`       | Pre-commit/push gate: format + lint + typecheck + test + API e2e + Expo Doctor + build |

## Workspace packages (`@jurisly/*`)

| Package                                                                | Role                                                         |
| ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| `@jurisly/config`                                                      | Shared TS/Prettier/Tailwind tokens                           |
| `@jurisly/database`                                                    | Drizzle + Postgres schema (incl. Better Auth tables)         |
| `@jurisly/trpc`                                                        | Shared tRPC `AppRouter`                                      |
| `@jurisly/api-client`                                                  | tRPC React client (`trpc` + React Query)                     |
| `@jurisly/types`, `@jurisly/utils`, `@jurisly/ui`, `@jurisly/waitlist` | Shared types, utilities, UI primitives, waitlist email logic |

## Deployment (overview)

- **Web (Vercel):** set project root to `apps/web`; see `apps/web/vercel.json`, [docs/DEPLOYMENT-FREE-TIER.md](./docs/DEPLOYMENT-FREE-TIER.md), and [docs/DEPLOYMENT-PRODUCTION.md](./docs/DEPLOYMENT-PRODUCTION.md).
- **API (Render or Railway / Fly):** Render: [`render.yaml`](./render.yaml) at repo root + deployment docs above; Railway: `apps/api/railway.toml`.
- **Mobile (EAS):** `eas.json` in `apps/mobile`; set `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_APP_URL` for production (Expo dashboard or export at build time; see [docs/DEPLOYMENT-FREE-TIER.md](./docs/DEPLOYMENT-FREE-TIER.md) §5); bundle ID `com.tryjurisly.app` in `app.json`.
- **GitHub:** optional [production smoke](.github/workflows/production-smoke.yml) and [production migrate](.github/workflows/production-migrate.yml) workflows — see [docs/DEPLOYMENT-PRODUCTION.md](./docs/DEPLOYMENT-PRODUCTION.md).

## App-level docs

- `apps/web/README.md`
- `apps/api/README.md`
- `apps/mobile/README.md`

## License

Private — all rights reserved unless otherwise stated.
