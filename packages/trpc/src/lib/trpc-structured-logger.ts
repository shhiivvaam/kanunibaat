/** Minimal structured logger shape (pino-compatible) injected from the API runtime. */
export interface TrpcStructuredLogger {
  info: (meta: Record<string, unknown>, msg?: string) => void;
  error: (meta: Record<string, unknown>, msg?: string) => void;
}

export const noopStructuredLogger: TrpcStructuredLogger = {
  info() {
    return;
  },
  error() {
    return;
  },
};
