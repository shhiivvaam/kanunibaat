import { TRPCError } from '@trpc/server';

import { appRouter } from '@jurisly/trpc';

import { trpcTestBaseCtx } from '../../test-utils/trpc-test-context';

describe('Phase 6 emergencyGuide router', () => {
  const baseCtx = trpcTestBaseCtx();

  it('bySlug throws NOT_FOUND for unknown slug', async () => {
    const caller = appRouter.createCaller(baseCtx as never);
    await expect(
      caller.emergencyGuide.bySlug({ slug: 'no-such-scenario' }),
    ).rejects.toMatchObject<Partial<TRPCError>>({
      code: 'NOT_FOUND',
    });
  });

  it('personalize returns fallback when OpenAI is not configured', async () => {
    const caller = appRouter.createCaller(baseCtx as never);
    const res = await caller.emergencyGuide.personalize({
      slug: 'legal-notice',
      stateCode: 'DL',
      answers: {
        notice_type: 'Court summons',
        deadline: 'Yes, 15 days',
        sender: 'Advocate',
      },
    });
    expect(res.mode).toBe('fallback');
    expect(res.guide.right_now.length).toBeGreaterThan(0);
    expect(res.notice).toContain('not configured');
  });
});
