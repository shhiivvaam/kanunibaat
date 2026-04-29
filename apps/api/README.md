# KanuniBaat API (`apps/api`)

NestJS API host for KanuniBaat.

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

## Core files

- `src/main.ts`: app bootstrap, env load, CORS, tRPC context wiring.
- `src/http-stack.ts`: `/trpc`, rate limits, webhook and internal endpoint mounts.
- `src/env.ts`: runtime env schema validation.

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
