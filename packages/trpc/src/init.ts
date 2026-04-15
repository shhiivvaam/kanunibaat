import { initTRPC, TRPCError } from '@trpc/server';

import type { TrpcContext } from './context';

const t = initTRPC.context<TrpcContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

const requireAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.authUserId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not signed in.' });
  }
  return next({
    ctx: {
      ...ctx,
      authUserId: ctx.authUserId,
    },
  });
});

export const protectedProcedure = publicProcedure.use(requireAuth);

export function roleProcedure(role: 'admin' | 'lawyer') {
  return protectedProcedure.use(({ ctx, next }) => {
    if (!ctx.roles.includes(role)) {
      throw new TRPCError({ code: 'FORBIDDEN', message: `Requires role: ${role}` });
    }
    return next({ ctx });
  });
}

export const adminProcedure = roleProcedure('admin');
export const lawyerProcedure = roleProcedure('lawyer');
