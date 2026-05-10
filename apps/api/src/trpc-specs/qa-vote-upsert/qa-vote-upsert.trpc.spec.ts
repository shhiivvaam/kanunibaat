import { appRouter } from '@jurisly/trpc';

import { trpcTestBaseCtx } from '../../test-utils/trpc-test-context';

describe('Phase 12 Q&A votes', () => {
  it('qa.vote.set uses an upsert (onConflictDoUpdate)', async () => {
    const calls: { kind: string }[] = [];

    const db = {
      insert: () => ({
        values: () => ({
          onConflictDoUpdate: () => {
            calls.push({ kind: 'upsert' });
            return Promise.resolve();
          },
        }),
      }),
      delete: () => ({
        where: () => Promise.resolve(),
      }),
    };

    const caller = appRouter.createCaller(
      trpcTestBaseCtx({
        db: db as never,
        authUserId: 'user-1',
        roles: ['user'],
      }) as never,
    );

    await caller.qa.vote.set({
      questionId: '00000000-0000-0000-0000-000000000000',
      value: 'up',
    });

    expect(calls).toEqual([{ kind: 'upsert' }]);
  });
});
