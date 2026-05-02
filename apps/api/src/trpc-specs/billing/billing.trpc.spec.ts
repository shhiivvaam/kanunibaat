import { TRPCError } from '@trpc/server';

import { appRouter } from '@jurisly/trpc';

import { trpcTestBaseCtx } from '../../test-utils/trpc-test-context';

describe('billing router', () => {
  const baseCtx = trpcTestBaseCtx();

  const mockPlans = [
    {
      id: 'p-free',
      key: 'free',
      name: 'Naagrik Free',
      priceInr: 0,
      period: 'month' as const,
      limitsJson: {},
    },
  ];

  it('plans.list returns plans after ensureDefaultPlans', async () => {
    const db = {
      insert() {
        return {
          values() {
            return {
              onConflictDoUpdate() {
                return Promise.resolve();
              },
            };
          },
        };
      },
      select() {
        return {
          from() {
            return {
              orderBy() {
                return Promise.resolve(mockPlans);
              },
            };
          },
        };
      },
    };
    const caller = appRouter.createCaller({
      ...baseCtx,
      db: db as never,
    } as never);
    const out = await caller.billing.plans.list();
    expect(out.plans).toEqual(mockPlans);
  });

  it('subscription.me returns nulls when user has no subscription', async () => {
    const db = {
      select() {
        return {
          from() {
            return {
              innerJoin() {
                return {
                  where() {
                    return {
                      orderBy() {
                        return {
                          limit() {
                            return Promise.resolve([]);
                          },
                        };
                      },
                    };
                  },
                };
              },
            };
          },
        };
      },
    };
    const caller = appRouter.createCaller({
      ...baseCtx,
      authUserId: 'user-1',
      db: db as never,
    } as never);
    await expect(caller.billing.subscription.me()).resolves.toEqual({
      subscription: null,
      plan: null,
    });
  });

  it('subscription.createOrUpdate rejects free plan with BAD_REQUEST', async () => {
    const caller = appRouter.createCaller({
      ...baseCtx,
      authUserId: 'user-1',
    } as never);
    await expect(
      caller.billing.subscription.createOrUpdate({ planKey: 'free' }),
    ).rejects.toMatchObject<Partial<TRPCError>>({
      code: 'BAD_REQUEST',
    });
  });
});
