# Phase 0 — Foundation (Week 1–2)

**Goal:** Monorepo initialized, tooling and CI running, environments documented, core infrastructure stubs in place.

## Checklist (blueprint → repo)

| Task                                    | Status                 | Where                                                                              |
| --------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------- |
| Turborepo + pnpm workspace              | Done                   | Root `package.json`, `pnpm-workspace.yaml`, `turbo.json`                           |
| Apps + packages directories             | Done                   | `apps/*`, `packages/*`                                                             |
| TypeScript strict (shared base)         | Done                   | `packages/config/typescript/base.json`; apps extend or set strict                  |
| ESLint + Prettier (shared)              | Done                   | Root `eslint.config.mjs`, `packages/config/prettier`                               |
| Tailwind shared config / tokens         | Done                   | `packages/config/tailwind/theme.css`, imported from `apps/web`                     |
| Drizzle + Supabase-compatible Postgres  | Done                   | `packages/database` + `drizzle.config.ts` (uses `DATABASE_URL`)                    |
| Better Auth                             | Done                   | `apps/web/src/lib/auth.ts`, `src/app/api/auth/[...all]/route.ts`                   |
| GitHub Actions (lint, typecheck, build) | Done                   | `.github/workflows/ci.yml`                                                         |
| Sentry                                  | Done (stubs)           | Web: `src/instrumentation.ts` + `@sentry/nextjs`; API: `@sentry/node` in `main.ts` |
| `.env.example`                          | Done                   | Repo root                                                                          |
| Vercel (web)                            | Documented + config    | `apps/web/vercel.json`, [Deployment](#deployment) below                            |
| Render (api, free tier)                 | Documented + blueprint | Root `render.yaml`, [DEPLOYMENT-FREE-TIER.md](./DEPLOYMENT-FREE-TIER.md)           |
| Railway (api)                           | Documented + config    | `apps/api/railway.toml`, [Deployment](#deployment) below                           |
| EAS Build (mobile)                      | Done                   | `apps/mobile/eas.json`, `app.json` bundle identifiers                              |
| tRPC + api-client                       | Done                   | `packages/trpc`, `packages/api-client`, API Express middleware                     |

## Commands

```bash
pnpm install          # runs prepare: build all workspace packages
pnpm lint
pnpm typecheck
pnpm build
pnpm dev              # turbo dev (web + api + mobile + …)
```

## Database migrations

From repo root (with `DATABASE_URL` set):

```bash
pnpm --filter @jurisly/database db:generate   # drizzle-kit generate
pnpm --filter @jurisly/database db:migrate    # apply SQL in packages/database/drizzle (preferred for prod)
pnpm --filter @jurisly/database db:push       # dev: push schema (Supabase local or hosted)
```

Apply Better Auth–compatible tables before signing up users. The schema in `packages/database/src/schema/auth.ts` matches Better Auth’s core model. Phase 2 adds `user_profile`, `user_role`, and `lawyer_profile` in `packages/database/src/schema/core.ts` (see [PHASE-2.md](./PHASE-2.md)).

## Deployment (manual steps in hosts)

Vercel, Render, and Railway projects are **created in their dashboards**; this repo ships **config hints** (`apps/web/vercel.json`, root `render.yaml`, `apps/api/railway.toml`).

- **Vercel (web):** set **Root Directory** to `apps/web`; build/install are in `apps/web/vercel.json`. Set env vars from `.env.example` and [DEPLOYMENT-FREE-TIER.md](./DEPLOYMENT-FREE-TIER.md).
- **Render (api):** apply root **`render.yaml`** as a Blueprint, or create a Node **Web Service** with the build/start commands in [DEPLOYMENT-FREE-TIER.md](./DEPLOYMENT-FREE-TIER.md). Set secrets in the dashboard.
- **Railway (api):** set root to repo or `apps/api`; start command `node dist/main.js` after `nest build`. Set `PORT` from platform.
- **EAS:** run `pnpm exec eas build` from `apps/mobile` after `eas login` and project linkage.

## What Phase 0 explicitly does _not_ include

- Production OTP (MSG91), payments (Razorpay), full lawyer flows — later phases.
- Remote **Turborepo** cache — optional; add `TURBO_TOKEN` / `TURBO_TEAM` in CI when ready.
