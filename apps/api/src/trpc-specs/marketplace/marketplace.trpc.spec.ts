import { TRPCError } from '@trpc/server';

import { appRouter, type TrpcContext } from '@jurisly/trpc';

import { trpcTestBaseCtx } from '../../test-utils/trpc-test-context';

jest.mock('@jurisly/search', () => ({
  ...jest.requireActual<typeof import('@jurisly/search')>('@jurisly/search'),
  searchLawyersWithFallback: jest.fn(() =>
    Promise.resolve({
      hits: [],
      source: 'postgres' as const,
    }),
  ),
}));

const searchModule =
  jest.requireMock<typeof import('@jurisly/search')>('@jurisly/search');

describe('marketplace router', () => {
  beforeEach(() => {
    jest.mocked(searchModule.searchLawyersWithFallback).mockClear();
    jest.mocked(searchModule.searchLawyersWithFallback).mockResolvedValue({
      hits: [],
      source: 'postgres',
    });
  });

  it('searchLawyers returns hits from search helper', async () => {
    const caller = appRouter.createCaller(trpcTestBaseCtx() as never);
    const out = await caller.marketplace.searchLawyers({
      query: 'privacy',
      limit: 10,
    });
    expect(out.hits).toEqual([]);
    expect(out.source).toBe('postgres');
    expect(searchModule.searchLawyersWithFallback).toHaveBeenCalled();
  });

  it('lawyerBySlug returns null when no verified lawyer', async () => {
    const db = {
      select() {
        return {
          from() {
            return {
              innerJoin() {
                return {
                  where() {
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
    const caller = appRouter.createCaller(
      trpcTestBaseCtx({
        db: db as unknown as TrpcContext['db'],
      }) as never,
    );
    const out = await caller.marketplace.lawyerBySlug({ slug: 'no-one' });
    expect(out.lawyer).toBeNull();
  });

  it('availabilityByLawyerUserId returns empty when no verified lawyer', async () => {
    const db = {
      select() {
        return {
          from() {
            return {
              where() {
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
    const caller = appRouter.createCaller(
      trpcTestBaseCtx({
        db: db as unknown as TrpcContext['db'],
      }) as never,
    );
    const out = await caller.marketplace.availabilityByLawyerUserId({
      lawyerUserId: 'u1',
    });
    expect(out.availability).toEqual([]);
  });

  it('searchLawyers rejects limit out of range', async () => {
    const caller = appRouter.createCaller(trpcTestBaseCtx() as never);
    await expect(
      caller.marketplace.searchLawyers({ query: '', limit: 100 }),
    ).rejects.toMatchObject<Partial<TRPCError>>({ code: 'BAD_REQUEST' });
  });
});
