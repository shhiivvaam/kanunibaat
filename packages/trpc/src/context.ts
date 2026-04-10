import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';

export type TrpcContext = Record<string, never>;

export function createTrpcContext(_opts: CreateExpressContextOptions): TrpcContext {
  return {};
}
