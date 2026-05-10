/\*\*

- Observability — status and backlog
-
- DONE (baseline)
- - tRPC error handling + Sentry in API http-stack; error masking in packages/trpc/src/init.ts.
- - Structured external API logging: packages/trpc/src/lib/external-api-logger.ts + `logExternalApiCall`.
- - Usage metering logs: packages/trpc/src/lib/usage-metrics.ts + `emitUsageMetric` (e.g. notice scans).
- - Google Vision path in notices router emits external API structured logs where integrated.
-
- BACKLOG
- - Wire `logExternalApiCall` across every integration surface (Razorpay helpers, MSG91 batch paths, QA/emergency/consultations AI calls).
- - Funnel/completion metrics (emitCompletionMetric pattern) for booking, vault upload, DigiLocker OAuth.
- - Cost metrics (tokens, Vision calls, SMS) with stable log schema for Grafana/Datadog queries.
- - Alerting: external API error rate, latency p95, repeated quota hits, payment verification failures.
- - Distributed tracing (OpenTelemetry) if not satisfied by pino + log aggregation alone.
    \*/

export {};
