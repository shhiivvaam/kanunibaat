import { TRPCError } from '@trpc/server';

import { appRouter } from '@jurisly/trpc';

import { trpcTestBaseCtx } from '../../test-utils/trpc-test-context';

describe('waitlist router', () => {
  it('submitUser fails validation on bad email', async () => {
    const caller = appRouter.createCaller(
      trpcTestBaseCtx({
        waitlistEnv: {
          nodeEnv: 'development',
          resendApiKey: undefined,
          fromEmail: undefined,
          notifyEmail: undefined,
        },
      }) as never,
    );
    await expect(
      caller.waitlist.submitUser({
        name: 'A',
        email: 'not-an-email',
      }),
    ).rejects.toMatchObject<Partial<TRPCError>>({ code: 'BAD_REQUEST' });
  });

  it('submitUser succeeds in development without Resend', async () => {
    const caller = appRouter.createCaller(
      trpcTestBaseCtx({
        waitlistEnv: {
          nodeEnv: 'development',
          resendApiKey: undefined,
          fromEmail: undefined,
          notifyEmail: undefined,
        },
      }) as never,
    );
    const out = await caller.waitlist.submitUser({
      name: 'Test User',
      email: 'test@example.com',
    });
    expect(out.status).toBe('success');
  });

  it('submitLawyer fails validation when phone too short', async () => {
    const caller = appRouter.createCaller(
      trpcTestBaseCtx({
        waitlistEnv: { nodeEnv: 'development' },
      }) as never,
    );
    await expect(
      caller.waitlist.submitLawyer({
        name: 'L',
        email: 'lawyer@example.com',
        phone: '123',
        barState: 'DL',
        enrollmentNumber: 'E1',
      }),
    ).rejects.toMatchObject<Partial<TRPCError>>({ code: 'BAD_REQUEST' });
  });
});

describe('profile router', () => {
  it('me is UNAUTHORIZED without session', async () => {
    const caller = appRouter.createCaller(trpcTestBaseCtx() as never);
    await expect(caller.profile.me()).rejects.toMatchObject<Partial<TRPCError>>(
      {
        code: 'UNAUTHORIZED',
      },
    );
  });

  it('update is UNAUTHORIZED without session', async () => {
    const caller = appRouter.createCaller(trpcTestBaseCtx() as never);
    await expect(
      caller.profile.update({ displayName: 'X' }),
    ).rejects.toMatchObject<Partial<TRPCError>>({ code: 'UNAUTHORIZED' });
  });

  it('createLawyerDraft is UNAUTHORIZED without session', async () => {
    const caller = appRouter.createCaller(trpcTestBaseCtx() as never);
    await expect(caller.profile.createLawyerDraft({})).rejects.toMatchObject<
      Partial<TRPCError>
    >({
      code: 'UNAUTHORIZED',
    });
  });
});
