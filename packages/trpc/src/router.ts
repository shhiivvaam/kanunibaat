import { initTRPC } from '@trpc/server';

import type { TrpcContext } from './context';

const t = initTRPC.context<TrpcContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const appRouter = router({
  health: publicProcedure.query(() => ({
    ok: true as const,
    service: 'kanunibaat-api',
    ts: new Date().toISOString(),
  })),
});

export type AppRouter = typeof appRouter;
