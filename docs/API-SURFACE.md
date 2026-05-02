# API Surface (tRPC + HTTP Endpoints)

## Base endpoints

- tRPC: `GET/POST {API_URL}/trpc`
- Health: `GET {API_URL}/health`

## HTTP endpoints (non-tRPC)

- `POST /webhooks/razorpay`
- `POST /webhooks/razorpay/subscriptions`
- `GET /webhooks/whatsapp` (verification)
- `POST /webhooks/whatsapp` (inbound events)
- `POST /internal/notifications/dispatch` (requires internal secret)
- `POST /internal/case-tracker/poll` (requires internal secret)

## Top-level tRPC routers

From `packages/trpc/src/router.ts`:

- `health`
- `marketplace`
- `notices`
- `consultations`
- `emergencyGuide`
- `vault`
- `cases`
- `practice`
- `research`
- `notifications`
- `caseTracker`
- `content`
- `qa`
- `billing`
- `integrations`
- `waitlist`
- `profile`
- `admin`
- `lawyer`

## Access pattern

- `publicProcedure`: unauthenticated endpoints (e.g. health, parts of marketing flows).
- `protectedProcedure`: authenticated endpoints tied to resolved `authUserId`.
- Role-gated procedures: `admin`, `lawyer`, `user` checks enforced by middleware.

## Rate-limit notes

Rate limiting is attached at `/trpc` middleware with stricter caps for high-cost routes (personalization, research summarization, PDF generation, billing/subscription mutations, court lookup).

Source: `apps/api/src/http/http-stack.ts`.

## Context dependencies

tRPC context currently includes:

- database handle,
- waitlist env,
- search config/index names,
- S3 document config,
- OCR and AI keys,
- Razorpay keys,
- LiveKit config,
- NJDG bridge config.

Source: `apps/api/src/main.ts` context factory setup.
