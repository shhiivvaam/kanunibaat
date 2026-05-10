import { TRPCError } from '@trpc/server';

import { appRouter } from '@jurisly/trpc';

import { trpcTestBaseCtx } from '../../test-utils/trpc-test-context';

describe('admin router', () => {
  const baseCtx = trpcTestBaseCtx();

  it('listUsers is UNAUTHORIZED without auth', async () => {
    const caller = appRouter.createCaller({
      ...baseCtx,
      authUserId: null,
    } as never);
    await expect(caller.admin.listUsers()).rejects.toMatchObject<
      Partial<TRPCError>
    >({ code: 'UNAUTHORIZED' });
  });

  it('listUsers is FORBIDDEN without admin role', async () => {
    const caller = appRouter.createCaller({
      ...baseCtx,
      authUserId: 'user-1',
      roles: ['user'],
    } as never);
    await expect(caller.admin.listUsers()).rejects.toMatchObject<
      Partial<TRPCError>
    >({ code: 'FORBIDDEN' });
  });
});
