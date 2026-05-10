import { TRPCError } from '@trpc/server';

import { appRouter } from '@jurisly/trpc';

import { trpcTestBaseCtx } from '../../test-utils/trpc-test-context';

describe('practice router', () => {
  const lawyerCtx = trpcTestBaseCtx({
    authUserId: 'lawyer-1',
    roles: ['lawyer'],
  });

  it('analytics.summary is FORBIDDEN without lawyer role', async () => {
    const caller = appRouter.createCaller(
      trpcTestBaseCtx({
        authUserId: 'user-1',
        roles: ['user'],
      }) as never,
    );
    await expect(
      caller.practice.analytics.summary({
        from: new Date('2026-01-01'),
        to: new Date('2026-01-31'),
      }),
    ).rejects.toMatchObject<Partial<TRPCError>>({ code: 'FORBIDDEN' });
  });

  it('analytics.summary is BAD_REQUEST when range is inverted', async () => {
    const caller = appRouter.createCaller(lawyerCtx as never);
    await expect(
      caller.practice.analytics.summary({
        from: new Date('2026-02-01'),
        to: new Date('2026-01-01'),
      }),
    ).rejects.toMatchObject<Partial<TRPCError>>({ code: 'BAD_REQUEST' });
  });

  it('billing.firm.get is FORBIDDEN without lawyer role', async () => {
    const caller = appRouter.createCaller(
      trpcTestBaseCtx({
        authUserId: 'user-1',
        roles: ['user'],
      }) as never,
    );
    await expect(caller.practice.billing.firm.get()).rejects.toMatchObject<
      Partial<TRPCError>
    >({
      code: 'FORBIDDEN',
    });
  });
});
