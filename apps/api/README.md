# Jurisly API (`apps/api`)

NestJS API host for Jurisly.

It serves:

- tRPC transport on `/trpc`,
- health checks,
- payment and channel webhooks,
- and internal scheduled-job endpoints.

## Start

From repo root:

```bash
PORT=4000 pnpm --filter api dev
```

Production build/start:

```bash
pnpm --filter api build
pnpm --filter api start
```

## Source layout

- **`src/main.ts`**, **`src/app.module.ts`**: Nest bootstrap and root module (keep at `src/` for Nest CLI).
- **`src/config/`**: `env.ts` and env validation tests.
- **`src/http/`**: `http-stack.ts` (Express adapter: `/trpc`, rate limits, webhooks, internal routes), `open-api.ts`, and HTTP-adjacent specs (e.g. session token extraction).
- **`src/consultation/`**: Consultation chat fanout + SSE attachment.
- **`src/case-tracker/`**: NJDG / case tracker poll handler.
- **`src/billing/`**: Razorpay webhooks, billing email helpers, and their unit tests.
- **`src/notifications/`**: Push notification dispatch for internal cron.
- **`src/whatsapp/`**: WhatsApp Cloud API integration, webhook, bot, and bot tests.
- **`src/lib/`**: Shared outbound HTTP and court bridge clients (with co-located specs).
- **`src/test-utils/`**: Shared Jest helpers (e.g. tRPC test context).
- **`src/trpc-specs/<domain>/`**: tRPC procedure tests — one folder per namespace (e.g. `admin/admin.trpc.spec.ts`), named **`*.trpc.spec.ts`** (not `*router.spec.ts`, since these are not Nest HTTP routers). Relative imports to `test-utils` and workspace packages must match folder depth.

## Core entrypoints

- `src/main.ts`: app bootstrap, env load, CORS, tRPC context wiring.
- `src/http/http-stack.ts`: `/trpc`, rate limits, webhook and internal endpoint mounts.
- `src/config/env.ts`: runtime env schema validation.

## Endpoint summary

- `GET /health`
- `GET/POST /trpc`
- `POST /webhooks/razorpay`
- `POST /webhooks/razorpay/subscriptions`
- `GET /webhooks/whatsapp`
- `POST /webhooks/whatsapp`
- `POST /internal/notifications/dispatch`
- `POST /internal/case-tracker/poll`

## Key environment variables

Required baseline:

- `PORT` (defaults to `4000`)
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- **`BETTER_AUTH_URL`** (required in **`production`**; public web URL, not the API host)
- **`VAULT_MALWARE_SCAN_PROVIDER=stub`** in **`production`** (only `stub` is implemented until antivirus integration exists)

Common optional integrations:

- Meili: `MEILISEARCH_*`
- OCR/AI: `GOOGLE_CLOUD_VISION_API_KEY`, `OPENAI_API_KEY`
- Payments: `RAZORPAY_*`
- Storage: `AWS_*`
- Live calls: `LIVEKIT_*`
- WhatsApp: `WHATSAPP_*`
- Internal jobs: `INTERNAL_CRON_SECRET`

Use root `.env.example` as the source of truth.

## Tests

```bash
pnpm --filter api test
```

For current API behavior and domain contracts:

- `docs/API-SURFACE.md`
- `docs/PROJECT-FLOWS.md`
