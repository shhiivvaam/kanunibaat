import { TRPCError } from '@trpc/server';

import { appRouter } from '@jurisly/trpc';

import { trpcTestBaseCtx } from '../../test-utils/trpc-test-context';

describe('consultations router', () => {
  const baseCtx = trpcTestBaseCtx();

  const validCreateInput = {
    lawyerUserId: 'lawyer-1',
    mode: 'chat' as const,
    scheduledAtIso: '2026-06-15T10:00:00.000Z',
    timeZone: 'Asia/Kolkata',
    issueSummary: 'This is a valid issue summary with enough characters.',
  };

  it('create is UNAUTHORIZED without auth', async () => {
    const caller = appRouter.createCaller({
      ...baseCtx,
      authUserId: null,
    } as never);
    await expect(
      caller.consultations.create(validCreateInput),
    ).rejects.toMatchObject<Partial<TRPCError>>({ code: 'UNAUTHORIZED' });
  });

  it('create fails validation when issueSummary is too short', async () => {
    const caller = appRouter.createCaller({
      ...baseCtx,
      authUserId: 'user-1',
    } as never);
    await expect(
      caller.consultations.create({
        ...validCreateInput,
        issueSummary: 'short',
      }),
    ).rejects.toMatchObject<Partial<TRPCError>>({ code: 'BAD_REQUEST' });
  });

  it('create is PRECONDITION_FAILED when lawyer is not verified', async () => {
    const db = {
      select() {
        return {
          from() {
            return {
              where() {
                return {
                  limit() {
                    return Promise.resolve([{ status: 'pending' }]);
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
    await expect(
      caller.consultations.create(validCreateInput),
    ).rejects.toMatchObject<Partial<TRPCError>>({
      code: 'PRECONDITION_FAILED',
      message: 'Lawyer is not verified.',
    });
  });
});
