import { TRPCError } from '@trpc/server';

import { appRouter } from '@kb/trpc';

describe('Phase 6 emergencyGuide router', () => {
  const baseCtx = {
    db: {} as never,
    authUserId: null,
    roles: [],
    waitlistEnv: {
      nodeEnv: 'test',
      resendApiKey: undefined,
      fromEmail: undefined,
      notifyEmail: undefined,
    },
    meili: null,
    meiliIndexName: 'lawyers',
    s3Documents: null,
    requestIp: '127.0.0.1',
    userAgent: 'jest',
    googleVisionApiKey: null,
    openaiApiKey: null,
    razorpayKeyId: null,
    razorpayKeySecret: null,
    livekitUrl: null,
    livekitApiKey: null,
    livekitApiSecret: null,
    njdgBridgeUrl: null,
    njdgBridgeSecret: null,
  };

  it('bySlug throws NOT_FOUND for unknown slug', async () => {
    const caller = appRouter.createCaller(baseCtx as never);
    await expect(caller.emergencyGuide.bySlug({ slug: 'no-such-scenario' })).rejects.toMatchObject<Partial<TRPCError>>({
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
