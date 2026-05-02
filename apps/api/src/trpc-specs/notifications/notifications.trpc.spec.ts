import { TRPCError } from '@trpc/server';

import { appRouter, type TrpcContext } from '@jurisly/trpc';

import { trpcTestBaseCtx } from '../../test-utils/trpc-test-context';

describe('notifications router', () => {
  it('registerExpoToken is UNAUTHORIZED without session', async () => {
    const caller = appRouter.createCaller(trpcTestBaseCtx() as never);
    await expect(
      caller.notifications.registerExpoToken({
        token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
      }),
    ).rejects.toMatchObject<Partial<TRPCError>>({ code: 'UNAUTHORIZED' });
  });

  it('registerExpoToken rejects invalid token shape', async () => {
    const caller = appRouter.createCaller(
      trpcTestBaseCtx({
        authUserId: 'user-1',
        roles: ['user'],
      }) as never,
    );
    await expect(
      caller.notifications.registerExpoToken({ token: 'not-a-token' }),
    ).rejects.toMatchObject<Partial<TRPCError>>({ code: 'BAD_REQUEST' });
  });

  it('registerWebPushSubscription rejects invalid subscription', async () => {
    const caller = appRouter.createCaller(
      trpcTestBaseCtx({
        authUserId: 'user-1',
        roles: ['user'],
      }) as never,
    );
    await expect(
      caller.notifications.registerWebPushSubscription({
        subscription: {
          endpoint: 'not-a-url',
          p256dh: 'x',
          auth: 'y',
        },
      }),
    ).rejects.toMatchObject<Partial<TRPCError>>({ code: 'BAD_REQUEST' });
  });

  it('enqueueSelfTest inserts a job when db supports insert', async () => {
    const calls: string[] = [];
    const db = {
      insert() {
        calls.push('insert');
        return {
          values() {
            return Promise.resolve();
          },
        };
      },
    };
    const caller = appRouter.createCaller(
      trpcTestBaseCtx({
        authUserId: 'user-1',
        roles: ['user'],
        db: db as unknown as TrpcContext['db'],
      }) as never,
    );
    await caller.notifications.enqueueSelfTest({ title: 't', body: 'b' });
    expect(calls).toContain('insert');
  });
});
