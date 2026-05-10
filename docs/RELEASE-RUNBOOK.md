# Release and migration runbook

## Preconditions

- **Branches**: merge via PR; CI must pass (`lint`, `typecheck`, `test`, API e2e, builds).
- **Secrets**: set on Render / Vercel per [DEPLOYMENT-FREE-TIER.md](./DEPLOYMENT-FREE-TIER.md), [DEPLOYMENT-PRODUCTION.md](./DEPLOYMENT-PRODUCTION.md), and root `.env.example`. On the API in **production**, ensure **`BETTER_AUTH_URL`** is the public web origin (not the API host) and **`VAULT_MALWARE_SCAN_PROVIDER=stub`** until antivirus integration exists (see [.env.example](../.env.example)).

## Database migrations

1. Review diff in `packages/database` migrations.
2. Against the **target** database URL:

   `pnpm --filter @jurisly/database db:migrate`

   Or use [`.github/workflows/production-migrate.yml`](../.github/workflows/production-migrate.yml) (GitHub Environment `production` + `DATABASE_URL` secret) as documented in [DEPLOYMENT-PRODUCTION.md](./DEPLOYMENT-PRODUCTION.md).

3. Deploy API **after** migrations when changes are backward-compatible, or use expand/contract patterns for breaking schema changes.

## Rollback

- **App**: redeploy previous Render / Vercel release or git revert + redeploy.
- **Schema**: avoid destructive migrations in a single release; keep down migrations or manual SQL only when planned.

## Smoke checks (production)

1. `GET https://<api>/health` → `status: ok`
2. `GET https://<api>/health/ready` → `database: true` when Postgres is reachable
3. `SMOKE_API_URL=https://<api> pnpm --filter api run smoke:trpc`
4. Browser: sign-in and one critical flow (e.g. consultation or billing).
5. Optional automation: [`.github/workflows/production-smoke.yml`](../.github/workflows/production-smoke.yml) (manual dispatch or repository variable `PRODUCTION_API_URL` on pushes to `main`); see [DEPLOYMENT-PRODUCTION.md](./DEPLOYMENT-PRODUCTION.md).

## Incident correlation

- Use `x-request-id` from API logs and Sentry `correlation_id` on tRPC errors to match BFF → API requests.
