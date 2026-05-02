# Free-tier deployment (Vercel + Render)

Deploy the **Next.js** app on **Vercel** and the **NestJS API** on **Render**, with **Postgres** on **Supabase** and **Redis** on **Upstash**. This matches [`.env.example`](../.env.example) and keeps the API as a long-lived Node process (needed for consultation **SSE**).

**Scope:** this guide assumes a **single production** environment. For naming, branch discipline, and `BETTER_AUTH_*` / `CORS_ORIGIN` pairing, see **[DEPLOYMENT-PRODUCTION.md](./DEPLOYMENT-PRODUCTION.md)**. A separate staging/DEV stack (second Render service, second database, preview CORS) is optional for later.

**Future (staging/DEV):** when you add a non-production environment, duplicate the pattern with a dedicated API + DB + stable staging web URL so `CORS_ORIGIN` stays an explicit allow list—do not point arbitrary Vercel preview URLs at production without updating CORS or running a dedicated staging API.

## 1. Supabase (Postgres)

1. Create a project at [supabase.com](https://supabase.com).
2. **Project Settings → Database → Connection string**
   - Use the **URI** (postgres://…).
   - For serverless-heavy workloads later, prefer the **pooler** (transaction mode) URL; for a single Render web service, direct DB URL is usually fine to start.
3. Copy into **`DATABASE_URL`** on **Render** (API) and anywhere else that runs migrations (`pnpm --filter @jurisly/database db:migrate` from CI or your machine with prod `DATABASE_URL`).
4. Apply migrations before relying on auth or data (see [PHASE-0.md](./PHASE-0.md)).
5. Optional: set **`SUPABASE_URL`**, **`SUPABASE_ANON_KEY`**, **`SUPABASE_SERVICE_KEY`** if features need the Supabase client.

## 2. Upstash (Redis)

1. Create a Redis database at [upstash.com](https://upstash.com).
2. Copy **`UPSTASH_REDIS_URL`** and **`UPSTASH_REDIS_TOKEN`** into **Render** (and **Vercel** if the web app uses Redis; rate limits / OTP may).

## 3. Render (API)

**Option A — Blueprint:** From the Render dashboard, use **Blueprint** and point at this repo; [`render.yaml`](../render.yaml) defines the web service, build, and start commands.

**Option B — Manual Web Service:**

| Setting           | Value                                                                                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Root directory    | Repository root (empty / `.`)                                                                                                                    |
| Runtime           | Node                                                                                                                                             |
| Build command     | `corepack enable && corepack prepare pnpm@10.33.0 --activate && pnpm install && pnpm approve-builds --all && pnpm exec turbo build --filter=api` |
| Start command     | `pnpm --filter api start:prod`                                                                                                                   |
| Health check path | `/health`                                                                                                                                        |

Use **Node 22** on Render (root [`.node-version`](../.node-version) and `engines` in [`package.json`](../package.json)).

Render sets **`PORT`** automatically; the API reads it via [`apps/api/src/config/env.ts`](../apps/api/src/config/env.ts).

**Environment variables (API):** mirror [`.env.example`](../.env.example) for every feature you enable. Minimum for a public app:

| Variable                                    | Notes                                                                                                                                                                              |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                                  | `production`                                                                                                                                                                       |
| `DATABASE_URL`                              | Supabase URI                                                                                                                                                                       |
| `CORS_ORIGIN`                               | Comma-separated **exact** production origins (e.g. `https://your.app`). Previews need separate staging or extra origins—see [DEPLOYMENT-PRODUCTION.md](./DEPLOYMENT-PRODUCTION.md) |
| `BETTER_AUTH_SECRET`                        | Same value as on Vercel                                                                                                                                                            |
| `BETTER_AUTH_URL`                           | Canonical **web** URL (https://…vercel.app or custom domain), not the API URL                                                                                                      |
| `UPSTASH_REDIS_URL` / `UPSTASH_REDIS_TOKEN` | If used                                                                                                                                                                            |
| Remaining keys                              | Per `.env.example` (Resend, Razorpay webhooks → use `https://<your-service>.onrender.com/...`, S3, etc.)                                                                           |

**Free tier:** the service **sleeps** when idle; the first request can be slow. Consultation SSE fan-out is **in-process**; a single instance is assumed until you move to Redis pub/sub.

## 4. Vercel (web)

1. Import the Git repo; set **Root Directory** to **`apps/web`**.
2. Install/build are already set in [`apps/web/vercel.json`](../apps/web/vercel.json) (monorepo `pnpm` + Turbo).
3. Set environment variables (at least):

| Variable              | Value                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL` | `https://<your-deployment>.vercel.app` or custom domain                                           |
| `NEXT_PUBLIC_API_URL` | `https://<your-api>.onrender.com` (no trailing slash)                                             |
| `INTERNAL_API_URL`    | Same as `NEXT_PUBLIC_API_URL` unless you use a private URL                                        |
| `BETTER_AUTH_SECRET`  | Same as Render                                                                                    |
| `BETTER_AUTH_URL`     | Same as `NEXT_PUBLIC_APP_URL` (browser-facing)                                                    |
| Plus                  | Any web-only vars from `.env.example` (DB if server components need it, Resend, Redis, Sentry, …) |

**Preview deployments:** avoid wiring Vercel **Preview** to the **production** API/database unless intentional. Prefer production env vars only on the **Production** branch (`main`) until you add staging.

## 5. Mobile (EAS)

For **store / production** builds, use the **`production`** profile in [`apps/mobile/eas.json`](../apps/mobile/eas.json).

Configure these at build time (EAS dashboard **Secrets** / environment variables, or `eas secret:push`—do not commit real URLs for multi-tenant repos if policy forbids it):

| Variable              | Value                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------ |
| `EXPO_PUBLIC_API_URL` | Public Render API base URL (no trailing slash), same host as `NEXT_PUBLIC_API_URL` on web. |
| `EXPO_PUBLIC_APP_URL` | Public web origin (same idea as `NEXT_PUBLIC_APP_URL`).                                    |

Example local one-off (never commit secrets into the shell history on shared machines):

```bash
cd apps/mobile
EXPO_PUBLIC_API_URL=https://YOUR_API.onrender.com EXPO_PUBLIC_APP_URL=https://YOUR_WEB_VERCEL_URL eas build --profile production --platform all
```

For day-to-day releases, set **`production`** environment variables in the [Expo dashboard](https://expo.dev) for this project so CI/local builds stay consistent.

## 6. Smoke checks after deploy

1. **API:** `curl -sf https://<api>.onrender.com/health` → JSON with `status`.
2. **tRPC:** from a machine with Node 22+, after setting `SMOKE_API_URL`:

   ```bash
   SMOKE_API_URL=https://<api>.onrender.com node apps/api/scripts/smoke-trpc.mjs
   ```

3. **Browser:** open the Vercel URL, sign in (Better Auth), open a consultation and confirm chat updates (SSE).

## 7. Razorpay webhooks

Point the Razorpay dashboard at your **Render** host, e.g. `https://<api>.onrender.com/webhooks/razorpay` (and subscription path if used — see [API-SURFACE.md](./API-SURFACE.md)). Set `RAZORPAY_WEBHOOK_SECRET` to the live webhook secret.
