import type { TrpcContext } from '@jurisly/trpc';
import { noopStructuredLogger } from '@jurisly/trpc';

/**
 * Default TRPC context for {@link import('@jurisly/trpc').appRouter.createCaller} in unit tests.
 * Override fields (e.g. `authUserId`, `roles`, `db`, `waitlistEnv`) per case.
 */
export function trpcTestBaseCtx(
  overrides: Partial<TrpcContext> = {},
): TrpcContext {
  return {
    db: {} as TrpcContext['db'],
    authUserId: null,
    roles: [],
    correlationId: null,
    logger: noopStructuredLogger,
    waitlistEnv: {
      nodeEnv: 'test',
      resendApiKey: undefined,
      fromEmail: undefined,
      notifyEmail: undefined,
    },
    meili: null,
    meiliIndexName: 'lawyers',
    meiliJudgmentsIndexName: 'judgments',
    s3Documents: null,
    requestIp: '127.0.0.1',
    userAgent: 'jest',
    googleVisionApiKey: null,
    openaiApiKey: null,
    razorpayKeyId: null,
    razorpayKeySecret: null,
    livekitUrl: null,
    livekitApiKey: null,
    livekitApiSecret: null,
    njdgBridgeUrl: null,
    njdgBridgeSecret: null,
    ...overrides,
  };
}
