# Onboarding Guide

This guide is the fastest path for a new developer or AI agent to become productive in Jurisly.

## 1) What this project is

Jurisly is a legal-tech platform with:

- public marketing + growth pages,
- authenticated app surfaces (user/lawyer/admin),
- backend workflows for legal features (scanner, consultations, vault, cases, research, billing),
- and integrations (Razorpay, WhatsApp, DigiLocker, Meili, S3, AI/OCR).

## 2) Monorepo map

- `apps/web`: Next.js web app + Better Auth host.
- `apps/api`: NestJS app exposing `/trpc` and webhook/internal endpoints.
- `apps/mobile`: Expo mobile client.
- `packages/trpc`: domain API routers (single source of app contract).
- `packages/database`: schema + migrations (single source of data contract).

## 3) Required setup

1. Copy `.env.example` -> `.env`.
2. Set required values at minimum:
   - `DATABASE_URL`
   - `BETTER_AUTH_SECRET`
   - `NEXT_PUBLIC_APP_URL`
   - `NEXT_PUBLIC_API_URL`
3. Install and build workspace deps:
   - **One command after clone:** `pnpm install` (Node 22+, pnpm 10+ per README). This runs `prepare`, which builds all `packages/*` **and** runs **Husky**, so **Git hooks are registered automatically** — no separate `husky init` or `chmod` for teammates.
   - **Do not** use `pnpm install --ignore-scripts`: that skips `prepare`, so hooks are not wired and `node_modules/.bin/pnpm` may be missing until you install again with scripts enabled.
4. **Commit / push guardrails:** `.husky/pre-commit` and `.husky/pre-push` run `pnpm verify` (format, lint, typecheck, tests, API e2e, Expo Doctor, full build). Bad commits/pushes are blocked until fixes land. Emergency bypass (use rarely): `HUSKY=0 git commit` or `HUSKY=0 git push`.
5. **Server-side backup:** Turn on GitHub **branch protection** and require the **CI** workflow to pass before merge, so bypassed hooks still cannot ship to `main`.
6. On a very fresh machine you only need a **one-time** way to run the first `pnpm install` (e.g. `corepack enable && corepack prepare pnpm@10.33.0 --activate`, or a global `pnpm`). After that, hooks use **`node_modules/.bin/pnpm`** from this repo.

## 4) Run local stack

- Web: `pnpm --filter web dev`
- API: `PORT=4000 pnpm --filter api dev`
- Mobile: `pnpm --filter mobile dev`

Root `pnpm dev` runs turbo dev for all apps that have `dev` scripts.

## 5) How to understand business logic quickly

Start in this order:

1. `packages/database/src/schema/core.ts` -> data model.
2. `packages/trpc/src/router.ts` -> domain router composition.
3. `packages/trpc/src/routers/*.ts` -> per-domain business logic.
4. `apps/web/src/app/[locale]` -> user-visible route surfaces.
5. `apps/api/src/http/http-stack.ts` -> public endpoint wiring and webhook behavior.

## 6) Documentation reading order

1. `docs/ARCHITECTURE.md`
2. `docs/PROJECT-FLOWS.md`
3. `docs/API-SURFACE.md`
4. `docs/PHASE-0.md` ... `docs/PHASE-14.md`
5. `docs/MOBILE-AUTH-DEEPLINKS.md`

## 7) First-day verification checklist

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- call `health` tRPC or `GET /health`
- open one localized route: `/en` and `/hi`
- run one protected app route with a signed-in user

## 8) Common mistakes

- Running API on port `3000` (conflicts with web); use `PORT=4000`.
- Skipping initial workspace build after install.
- Using direct API URL in web when same-origin tRPC proxy is expected.
- Assuming all integrations are required locally; many are optional and feature-gated by env presence.
