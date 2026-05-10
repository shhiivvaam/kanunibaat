import type { StructuredLogSink } from './external-api-logger';

/**
 * Emits a usage metric event for structured logging and monitoring.
 */
export function emitUsageMetric(opts: {
  logger: StructuredLogSink;
  userId: string;
  meterKey: string;
  value: number;
  metadata?: Record<string, unknown>;
}): void {
  opts.logger.info({
    msg: 'Usage meter incremented',
    user_id: opts.userId,
    meter_key: opts.meterKey,
    value: opts.value,
    ...opts.metadata,
  });
}
