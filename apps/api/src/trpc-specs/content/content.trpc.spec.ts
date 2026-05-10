import { TRPCError } from '@trpc/server';

import { appRouter, type TrpcContext } from '@jurisly/trpc';

import { trpcTestBaseCtx } from '../../test-utils/trpc-test-context';

describe('content router', () => {
  function dbForList(rows: unknown[]) {
    return {
      select() {
        return {
          from() {
            return {
              where() {
                return {
                  orderBy() {
                    return {
                      limit() {
                        return Promise.resolve(rows);
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
  }

  function dbForBySlug(rows: unknown[]) {
    return {
      select() {
        return {
          from() {
            return {
              where() {
                return {
                  limit() {
                    return Promise.resolve(rows);
                  },
                };
              },
            };
          },
        };
      },
    };
  }

  it('article.list returns items', async () => {
    const caller = appRouter.createCaller(
      trpcTestBaseCtx({
        db: dbForList([]) as unknown as TrpcContext['db'],
      }) as never,
    );
    const out = await caller.content.article.list({ limit: 5 });
    expect(out.items).toEqual([]);
  });

  it('article.bySlug is NOT_FOUND when missing', async () => {
    const caller = appRouter.createCaller(
      trpcTestBaseCtx({
        db: dbForBySlug([]) as unknown as TrpcContext['db'],
      }) as never,
    );
    await expect(
      caller.content.article.bySlug({ slug: 'missing' }),
    ).rejects.toMatchObject<Partial<TRPCError>>({ code: 'NOT_FOUND' });
  });

  it('article.incrementViews calls update', async () => {
    const calls: string[] = [];
    const db = {
      update() {
        calls.push('update');
        return {
          set() {
            return {
              where() {
                return Promise.resolve();
              },
            };
          },
        };
      },
    };
    const caller = appRouter.createCaller(
      trpcTestBaseCtx({
        db: db as unknown as TrpcContext['db'],
      }) as never,
    );
    await caller.content.article.incrementViews({ slug: 'x' });
    expect(calls).toContain('update');
  });
});
