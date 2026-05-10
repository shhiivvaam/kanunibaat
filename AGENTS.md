# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Jurisly is a **pnpm + Turborepo monorepo** with three apps and five shared packages:

| App/Package          | Path          | Dev Command                       |
| -------------------- | ------------- | --------------------------------- |
| **API** (NestJS)     | `apps/api`    | `PORT=4000 pnpm --filter api dev` |
| **Web** (Next.js 16) | `apps/web`    | `pnpm --filter web dev`           |
| **Mobile** (Expo/RN) | `apps/mobile` | `pnpm --filter mobile dev`        |
| Shared packages      | `packages/*`  | `pnpm build` (builds all)         |

Standard commands (`pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`) are documented in the root `README.md`.

**API source layout** (config, HTTP stack, domain folders, `trpc-specs/` naming): [apps/api/README.md](apps/api/README.md) (“Source layout”).

### Non-obvious caveats

- **Build before typecheck**: The `@jurisly/types` package must be built before `@jurisly/utils` can typecheck. Run `pnpm build` at least once after a fresh install so `dist/` output exists for workspace-linked packages. If typecheck fails with `TS2307: Cannot find module '@jurisly/types'`, this is the reason.
- **API port conflict**: Both the API and Web default to port 3000. Always start the API with `PORT=4000` to avoid conflicts (consistent with `.env.example`).
- **`NODE_ENV` warning in Next.js**: The `.env` file sets `NODE_ENV=development`, which Next.js detects as "non-standard" when combined with `next dev`. This warning is harmless and can be ignored.
- **No external services required for basic dev**: The API scaffold has no database/Redis/etc. wired up yet. All dev servers start without external dependencies.
- **pnpm lockfile drift**: `pnpm install --frozen-lockfile` may fail if `pnpm-lock.yaml` is out of sync with `package.json` versions. Use `pnpm install` (without `--frozen-lockfile`) locally.
- **Git hooks (Husky)**: After a normal **`pnpm install`**, `prepare` runs **Husky** and hooks use **`node_modules/.bin/pnpm verify`** (no extra setup). **Never use `pnpm install --ignore-scripts`** — it skips hook installation and the local `pnpm` shim. Emergency bypass only: `HUSKY=0 git commit` / `git push`. Enforce on **`main`** with GitHub **branch protection** + required **CI** check so hooks are not the only line of defense.
- **Production deploy (Vercel / Render / EAS)**: [docs/DEPLOYMENT-PRODUCTION.md](docs/DEPLOYMENT-PRODUCTION.md) and [docs/DEPLOYMENT-FREE-TIER.md](docs/DEPLOYMENT-FREE-TIER.md); optional GitHub Actions: `.github/workflows/production-smoke.yml`, `production-migrate.yml`.
