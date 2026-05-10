export interface StructuredLogSink {
  info: (meta: Record<string, unknown>, msg?: string) => void;
}

/**
 * External service providers integrated in the application.
 */
export type ExternalProvider =
  | 'razorpay'
  | 'msg91'
  | 'openai'
  | 'anthropic'
  | 'aws_s3'
  | 'digilocker'
  | 'njdg'
  | 'google_vision';

/**
 * Logs an external API call with structured metadata for monitoring and debugging.
 */
export function logExternalApiCall(opts: {
  logger: StructuredLogSink;
  provider: ExternalProvider;
  operation: string;
  startTime: number;
  success: boolean;
  statusCode?: number;
  requestId?: string;
  metadata?: Record<string, unknown>;
}): void {
  const duration = Date.now() - opts.startTime;
  opts.logger.info({
    msg: `External API: ${opts.provider}.${opts.operation}`,
    provider: opts.provider,
    operation: opts.operation,
    duration_ms: duration,
    success: opts.success,
    status_code: opts.statusCode,
    request_id: opts.requestId,
    ...opts.metadata,
  });
}
