import { TRPCError } from '@trpc/server';
import { initTRPC } from '@trpc/server';

import {
  lawyerWaitlistInputSchema,
  submitLawyerWaitlist,
  submitUserWaitlist,
  userWaitlistInputSchema,
} from '@kb/waitlist';

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

  waitlist: router({
    submitUser: publicProcedure.input(userWaitlistInputSchema).mutation(async ({ ctx, input }) => {
      const result = await submitUserWaitlist(input, ctx.waitlistEnv);
      if (!result.ok) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: result.message,
        });
      }
      return { status: 'success' as const, message: result.message };
    }),

    submitLawyer: publicProcedure.input(lawyerWaitlistInputSchema).mutation(async ({ ctx, input }) => {
      const result = await submitLawyerWaitlist(input, ctx.waitlistEnv);
      if (!result.ok) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: result.message,
        });
      }
      return { status: 'success' as const, message: result.message };
    }),
  }),
});

export type AppRouter = typeof appRouter;
