# Service catalog and environment matrix

This document inventories **applications**, **data stores**, **integrations**, and **which environment variables gate which behavior**. Deployment topology for the default free-tier layout is in [DEPLOYMENT-FREE-TIER.md](./DEPLOYMENT-FREE-TIER.md) (Vercel web, Render API, Supabase Postgres, Upstash Redis).

## Applications

| App    | Path          | Role                                                                                                |
| ------ | ------------- | --------------------------------------------------------------------------------------------------- |
| API    | `apps/api`    | NestJS host: tRPC `/trpc`, webhooks, internal cron HTTP, OpenAPI, SSE fan-out for consultation chat |
| Web    | `apps/web`    | Next.js: marketing, Better Auth, BFF proxy `/api/trpc` → `INTERNAL_API_URL`                         |
| Mobile | `apps/mobile` | Expo: direct tRPC to public API (`EXPO_PUBLIC_API_URL`)                                             |

## Shared packages (selected)

| Package             | Role                                              |
| ------------------- | ------------------------------------------------- |
| `packages/trpc`     | tRPC `appRouter`, auth context, domain procedures |
| `packages/database` | Drizzle + Postgres schema, migrations             |
| `packages/search`   | Meilisearch client helpers                        |
| `packages/storage`  | S3 presign and document storage                   |

## Integrations

| Integration     | Used for                         | Gating env vars (API)                                                                                                                |
| --------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Postgres        | Auth sessions, all domain data   | `DATABASE_URL` (required in **production** by `loadApiEnv`)                                                                          |
| Better Auth     | Cookies / bearer sessions        | `BETTER_AUTH_SECRET` (required in production); `BETTER_AUTH_URL`, `BETTER_AUTH_SESSION_COOKIE_NAMES`, `NEXT_PUBLIC_APP_URL` optional |
| Meilisearch     | Lawyer + judgment search         | `MEILISEARCH_URL` + `MEILISEARCH_MASTER_KEY` (pair validated in production)                                                          |
| AWS S3          | Vault / uploads                  | All of `AWS_*` bucket fields if any are set (validated in production)                                                                |
| Razorpay        | Payments + subscriptions         | `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` pair; `RAZORPAY_WEBHOOK_SECRET` mounts webhooks                                            |
| Resend          | transactional email              | `RESEND_API_KEY`, `FROM_EMAIL`                                                                                                       |
| LiveKit         | consultation video               | All `LIVEKIT_*` if any set                                                                                                           |
| WhatsApp        | Cloud API webhooks               | `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN` together                                                   |
| NJDG bridge     | Case tracker / CNR lookup        | `NJDG_BRIDGE_URL` + `NJDG_BRIDGE_SECRET` together                                                                                    |
| OpenAI / Vision | AI features                      | `OPENAI_API_KEY`, `GOOGLE_CLOUD_VISION_API_KEY`                                                                                      |
| Upstash Redis   | Rate limits / cache (when wired) | `UPSTASH_REDIS_URL`, `UPSTASH_REDIS_TOKEN`                                                                                           |
| Sentry          | Errors                           | `SENTRY_DSN`, etc.                                                                                                                   |

## Architecture graph

Regenerate coupling / hotspot reports locally (AST-only):

`graphify update .`

Outputs under `graphify-out/` when the graphify CLI is available.

## Observability

- **HTTP**: `pino-http` with `x-request-id` / `x-correlation-id` passthrough and generated IDs when missing.
- **tRPC**: Errors logged with `correlationId` from the same headers; Sentry tag `correlation_id`.
- **Health**: `GET /health` liveness; `GET /health/ready` checks `select 1` against Postgres.

## Supply chain

- CI runs `pnpm audit --audit-level critical` with intent to raise when the tree is clean.
- PRs run [Dependency review](../.github/workflows/dependency-review.yml) when GitHub dependency graph is enabled.
- [Dependabot](../.github/dependabot.yml) proposes weekly npm updates.
