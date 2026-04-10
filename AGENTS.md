# AGENTS.md

## Cursor Cloud specific instructions

### Overview

KanuniBaat is a **pnpm + Turborepo monorepo** with three apps and five shared packages:

| App/Package | Path | Dev Command |
|---|---|---|
| **API** (NestJS) | `apps/api` | `PORT=4000 pnpm --filter api dev` |
| **Web** (Next.js 16) | `apps/web` | `pnpm --filter web dev` |
| **Mobile** (Expo/RN) | `apps/mobile` | `pnpm --filter mobile dev` |
| Shared packages | `packages/*` | `pnpm build` (builds all) |

Standard commands (`pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`) are documented in the root `README.md`.

### Non-obvious caveats

- **Build before typecheck**: The `@kb/types` package must be built before `@kb/utils` can typecheck. Run `pnpm build` at least once after a fresh install so `dist/` output exists for workspace-linked packages. If typecheck fails with `TS2307: Cannot find module '@kb/types'`, this is the reason.
- **API port conflict**: Both the API and Web default to port 3000. Always start the API with `PORT=4000` to avoid conflicts (consistent with `.env.example`).
- **`NODE_ENV` warning in Next.js**: The `.env` file sets `NODE_ENV=development`, which Next.js detects as "non-standard" when combined with `next dev`. This warning is harmless and can be ignored.
- **No external services required for basic dev**: The API scaffold has no database/Redis/etc. wired up yet. All dev servers start without external dependencies.
- **pnpm lockfile drift**: `pnpm install --frozen-lockfile` may fail if `pnpm-lock.yaml` is out of sync with `package.json` versions. Use `pnpm install` (without `--frozen-lockfile`) locally.
