import { TRPCError } from '@trpc/server';

import { appRouter } from '@jurisly/trpc';
import * as billingEntitlements from '../../../../../packages/trpc/dist/billing/entitlements';

import { trpcTestBaseCtx } from '../../test-utils/trpc-test-context';

describe('caseTracker router', () => {
  const baseCtx = trpcTestBaseCtx();

  const proEntitlements: Awaited<
    ReturnType<typeof billingEntitlements.computeEntitlementsForUser>
  > = {
    planKey: 'pro',
    limits: {
      noticeScansPerMonth: null,
      vaultDocsMax: null,
      vaultStorageBytesMax: 5 * 1024 * 1024 * 1024,
      caseTrackerEnabled: true,
      aiEnabled: true,
      priorityMatching: true,
    },
    usage: {
      noticeScansThisPeriod: 0,
      noticeScansRemaining: null,
      periodStartAt: new Date('2026-04-01T00:00:00.000Z'),
    },
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('lookupByCnr is UNAUTHORIZED without auth', async () => {
    const caller = appRouter.createCaller({
      ...baseCtx,
      authUserId: null,
    } as never);
    await expect(
      caller.caseTracker.lookupByCnr({ cnr: 'ABCD123456789012' }),
    ).rejects.toMatchObject<Partial<TRPCError>>({ code: 'UNAUTHORIZED' });
  });

  it('lookupByCnr is FORBIDDEN on free tier', async () => {
    const caller = appRouter.createCaller({
      ...baseCtx,
      authUserId: 'user-1',
    } as never);
    await expect(
      caller.caseTracker.lookupByCnr({ cnr: 'ABCD123456789012' }),
    ).rejects.toMatchObject<Partial<TRPCError>>({ code: 'FORBIDDEN' });
  });

  it('lookupByCnr is PRECONDITION_FAILED when entitled but bridge is not configured', async () => {
    jest
      .spyOn(billingEntitlements, 'computeEntitlementsForUser')
      .mockResolvedValue(proEntitlements);
    const caller = appRouter.createCaller({
      ...baseCtx,
      authUserId: 'user-1',
    } as never);
    await expect(
      caller.caseTracker.lookupByCnr({ cnr: 'ABCD123456789012' }),
    ).rejects.toMatchObject<Partial<TRPCError>>({
      code: 'PRECONDITION_FAILED',
    });
  });

  it('lookupByCnr returns snapshot when bridge responds with JSON', async () => {
    jest
      .spyOn(billingEntitlements, 'computeEntitlementsForUser')
      .mockResolvedValue(proEntitlements);
    const origFetch = global.fetch;
    global.fetch = jest.fn(async () =>
      Promise.resolve(
        new Response(JSON.stringify({ court: 'Test', stage: 'listed' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    try {
      const caller = appRouter.createCaller({
        ...baseCtx,
        authUserId: 'user-1',
        njdgBridgeUrl: 'https://bridge.example.test/lookup',
        njdgBridgeSecret: 'secret',
      } as never);
      const out = await caller.caseTracker.lookupByCnr({
        cnr: 'ABCD123456789012',
      });
      expect(out.cnr).toBe('ABCD123456789012');
      expect(out.snapshot).toEqual({ court: 'Test', stage: 'listed' });
      expect(global.fetch).toHaveBeenCalled();
    } finally {
      global.fetch = origFetch;
    }
  });

  it('lookupByCnr is BAD_REQUEST for invalid CNR when entitled', async () => {
    jest
      .spyOn(billingEntitlements, 'computeEntitlementsForUser')
      .mockResolvedValue(proEntitlements);
    const caller = appRouter.createCaller({
      ...baseCtx,
      authUserId: 'user-1',
      njdgBridgeUrl: 'https://bridge.example.test/lookup',
      njdgBridgeSecret: 'secret',
    } as never);
    await expect(
      caller.caseTracker.lookupByCnr({ cnr: 'SHORT' }),
    ).rejects.toMatchObject<Partial<TRPCError>>({ code: 'BAD_REQUEST' });
  });

  it('track is FORBIDDEN on free tier', async () => {
    const caller = appRouter.createCaller({
      ...baseCtx,
      authUserId: 'user-1',
    } as never);
    await expect(
      caller.caseTracker.track({ cnr: 'ABCD123456789012' }),
    ).rejects.toMatchObject<Partial<TRPCError>>({ code: 'FORBIDDEN' });
  });

  it('track succeeds when entitled with minimal db mock', async () => {
    jest
      .spyOn(billingEntitlements, 'computeEntitlementsForUser')
      .mockResolvedValue(proEntitlements);
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
    };
    const caller = appRouter.createCaller({
      ...baseCtx,
      authUserId: 'user-1',
      db: db as never,
    } as never);
    await expect(
      caller.caseTracker.track({ cnr: 'ABCD123456789012' }),
    ).resolves.toEqual({ ok: true });
  });

  it('list returns rows for user', async () => {
    const rows = [
      { id: '1', userId: 'user-1', cnr: 'ABCD123456789012', enabled: true },
    ];
    const db = {
      select() {
        return {
          from() {
            return {
              where() {
                return Promise.resolve(rows);
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
    await expect(caller.caseTracker.list()).resolves.toEqual(rows);
  });
});
