import { TRPCError } from '@trpc/server';

import { appRouter } from '@jurisly/trpc';

import { trpcTestBaseCtx } from '../../test-utils/trpc-test-context';

describe('lawyer router', () => {
  it('bootstrap is UNAUTHORIZED without session', async () => {
    const caller = appRouter.createCaller(trpcTestBaseCtx() as never);
    await expect(caller.lawyer.bootstrap()).rejects.toMatchObject<
      Partial<TRPCError>
    >({
      code: 'UNAUTHORIZED',
    });
  });

  it('updateOnboarding is FORBIDDEN without lawyer role', async () => {
    const caller = appRouter.createCaller(
      trpcTestBaseCtx({
        authUserId: 'user-1',
        roles: ['user'],
      }) as never,
    );
    await expect(
      caller.lawyer.updateOnboarding({ headline: 'Hi' }),
    ).rejects.toMatchObject<Partial<TRPCError>>({ code: 'FORBIDDEN' });
  });
});
