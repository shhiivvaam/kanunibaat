import { TRPCError } from '@trpc/server';

import { appRouter } from '@kb/trpc';

describe('Phase 8 cases router', () => {
  const baseCtx = {
    db: {} as never,
    authUserId: null as string | null,
    roles: [] as const,
    waitlistEnv: {
      nodeEnv: 'test',
      resendApiKey: undefined,
      fromEmail: undefined,
      notifyEmail: undefined,
    },
    meili: null,
    meiliIndexName: 'lawyers',
    meiliJudgmentsIndexName: 'judgments',
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

  it('cases.case.list is FORBIDDEN without lawyer role', async () => {
    const caller = appRouter.createCaller({
      ...baseCtx,
      authUserId: 'user-1',
      roles: ['user'],
    } as never);
    await expect(caller.cases.case.list({})).rejects.toMatchObject<Partial<TRPCError>>({
      code: 'FORBIDDEN',
    });
  });

  it('cases.court.lookupByCnr is PRECONDITION_FAILED when bridge is not configured', async () => {
    const caller = appRouter.createCaller({
      ...baseCtx,
      authUserId: 'lawyer-1',
      roles: ['user', 'lawyer'],
    } as never);
    await expect(caller.cases.court.lookupByCnr({ cnr: 'ABCD123456789012' })).rejects.toMatchObject<
      Partial<TRPCError>
    >({
      code: 'PRECONDITION_FAILED',
    });
  });

  it('cases.court.lookupByCnr returns snapshot when bridge responds with JSON', async () => {
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
        authUserId: 'lawyer-1',
        roles: ['user', 'lawyer'],
        njdgBridgeUrl: 'https://bridge.example.test/lookup',
        njdgBridgeSecret: 'secret',
      } as never);
      const out = await caller.cases.court.lookupByCnr({ cnr: 'ABCD123456789012' });
      expect(out.cnr).toBe('ABCD123456789012');
      expect(out.snapshot).toEqual({ court: 'Test', stage: 'listed' });
      expect(global.fetch).toHaveBeenCalled();
    } finally {
      global.fetch = origFetch;
    }
  });
});
