# Production environment (single stack)

This repository currently targets **one production stack**: Next.js on **Vercel**, NestJS API on **Render**, Postgres (e.g. Supabase), and **EAS** builds for mobile. Staging/DEV (second API, second database, dedicated preview CORS) is deferred—see [DEPLOYMENT-FREE-TIER.md](./DEPLOYMENT-FREE-TIER.md) and the note at the end of that doc.

## Naming and branch discipline

| Piece                       | Convention                                                                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Git production branch**   | `main` (protected; merge via PR after CI passes).                                                                                                                  |
| **Render web service**      | Blueprint name `jurisly-api` ([`render.yaml`](../render.yaml)); production deploys from `main`.                                                                    |
| **Vercel**                  | One project; root **`apps/web`**; **Production** environment targets `main`.                                                                                       |
| **Postgres `DATABASE_URL`** | Production Supabase (or other) URI **only** on Render and in controlled migration paths—not in Vercel unless server code requires it.                              |
| **`BETTER_AUTH_URL`**       | Canonical **browser** origin: same as production `NEXT_PUBLIC_APP_URL` / public web URL. **Not** the API host. Set identically on Render (API) and Vercel (web).   |
| **`BETTER_AUTH_SECRET`**    | Same strong secret on **both** Render and Vercel (`openssl rand -base64 32`).                                                                                      |
| **`CORS_ORIGIN`** (API)     | Comma-separated **exact** `https://…` origins: production web URL(s) and any other allowed browser origins. See [`apps/api/src/main.ts`](../apps/api/src/main.ts). |

Placeholders (replace with your real hosts):

| Variable / concept | Example pattern                                            |
| ------------------ | ---------------------------------------------------------- |
| Public web URL     | `https://<project>.vercel.app` or `https://yourdomain.com` |
| Public API URL     | `https://<service>.onrender.com` (no trailing slash)       |

## Cross-service checklist

Before first production cut and after changing domains:

1. **Render:** `DATABASE_URL`, `NODE_ENV=production`, `CORS_ORIGIN`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `VAULT_MALWARE_SCAN_PROVIDER=stub`, plus keys from [`.env.example`](../.env.example) for enabled features.
2. **Vercel:** `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `INTERNAL_API_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, and any web-only vars from `.env.example`.
3. **CORS:** Every browser origin that calls the API must appear in `CORS_ORIGIN` on Render. Vercel **preview** deployments get unique URLs; they do **not** match production CORS unless you add them or add staging later.
4. **EAS production build:** Set `EXPO_PUBLIC_API_URL` to the **public Render API URL** and `EXPO_PUBLIC_APP_URL` to the **public web URL** (EAS env / secrets; see [DEPLOYMENT-FREE-TIER.md](./DEPLOYMENT-FREE-TIER.md) §5).

## Automation in this repo

- **CI:** [.github/workflows/ci.yml](../.github/workflows/ci.yml) — required before merge.
- **Optional smoke (production API):** [.github/workflows/production-smoke.yml](../.github/workflows/production-smoke.yml) — **Actions → Production smoke → Run workflow** with your API URL; or set repository **variable** `PRODUCTION_API_URL` so pushes to `main` run health + tRPC smoke automatically.
- **Optional migrations:** [.github/workflows/production-migrate.yml](../.github/workflows/production-migrate.yml) — **Actions → Production database migrate**; requires a GitHub **Environment** named `production` containing secret **`DATABASE_URL`** (add optional reviewers under _Environment protection rules_). Type `migrate` in the confirmation field when prompted.

**Branch protection (GitHub):** protect `main` — require the CI status check, restrict who can push, and use PRs only so production deploys follow review.

## Verification

Use [RELEASE-RUNBOOK.md](./RELEASE-RUNBOOK.md): `/health`, `/health/ready`, tRPC smoke, and a full browser sign-in flow on production URLs.
