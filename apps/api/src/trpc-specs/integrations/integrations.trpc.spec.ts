import { TRPCError } from '@trpc/server';

import { appRouter } from '@jurisly/trpc';

import { trpcTestBaseCtx } from '../../test-utils/trpc-test-context';

describe('integrations router (DigiLocker)', () => {
  it('digilocker.status is UNAUTHORIZED without session', async () => {
    const caller = appRouter.createCaller(trpcTestBaseCtx() as never);
    await expect(caller.integrations.digilocker.status()).rejects.toMatchObject<
      Partial<TRPCError>
    >({ code: 'UNAUTHORIZED' });
  });

  it('digilocker.status returns disabled when integration not configured', async () => {
    const caller = appRouter.createCaller(
      trpcTestBaseCtx({
        authUserId: 'user-1',
        roles: ['user'],
      }) as never,
    );
    const out = await caller.integrations.digilocker.status();
    expect(out.enabled).toBe(false);
    expect(out.connected).toBe(false);
  });

  it('digilocker.getAuthUrl is UNAUTHORIZED without session', async () => {
    const caller = appRouter.createCaller(trpcTestBaseCtx() as never);
    await expect(
      caller.integrations.digilocker.getAuthUrl(),
    ).rejects.toMatchObject<Partial<TRPCError>>({ code: 'UNAUTHORIZED' });
  });
});
