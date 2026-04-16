import { computeEntitlementsForUser } from '@kb/trpc/src/billing/entitlements';

describe('Phase 13 billing entitlements', () => {
  it('computes notice scan remaining for free plan', async () => {
    const db = {
      insert: () => ({
        values: () => ({
          onConflictDoUpdate: () => Promise.resolve(),
        }),
      }),
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([]),
          }),
          innerJoin: () => ({
            where: () => ({
              orderBy: () => ({
                limit: () => Promise.resolve([]),
              }),
            }),
          }),
        }),
      }),
    } as never;

    const ent = await computeEntitlementsForUser({
      db,
      userId: 'user-1',
      now: new Date('2026-04-16T00:00:00.000Z'),
    });
    expect(ent.planKey).toBe('free');
    expect(ent.limits.noticeScansPerMonth).toBe(2);
  });
});
