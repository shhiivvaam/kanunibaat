# Outbound HTTP and SSRF posture

## Principles

1. **No user-controlled URLs** in `fetch()` or other HTTP clients. Callers must use fixed integration endpoints (Meili, Razorpay, NJDG bridge URL from env, etc.).
2. **Timeouts**: use `fetchWithTimeout` in `apps/api/src/lib/outbound-fetch.ts` (or equivalent) so outbound calls cannot hang workers indefinitely. **WhatsApp Graph sends** (`apps/api/src/whatsapp/cloud-api.ts`) and **Expo push** (`apps/api/src/notifications/notifications-dispatch.ts`) use this helper; keep new outbound calls consistent.
3. **NJDG / court bridge**: URL and secret come only from validated API env (`NJDG_BRIDGE_*`). The bridge is treated as a trusted server-side integration, not an open proxy.

## If future features need “fetch this URL”

- Allow-list hostnames or use a dedicated egress proxy.
- Block private/link-local ranges unless explicitly required and audited.
- Log `correlationId` and route name; never echo raw URLs with secrets to clients.

## Webhooks (inbound)

- Razorpay: raw body + HMAC verification; idempotency via DB ledger where implemented.
- WhatsApp: verify token + optional app secret; avoid logging full payloads.
