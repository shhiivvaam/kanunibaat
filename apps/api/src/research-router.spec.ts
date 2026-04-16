import { TRPCError } from '@trpc/server';

import { appRouter } from '@kb/trpc';

describe('Phase 9 research router', () => {
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

  it('research.judgments.search is FORBIDDEN without lawyer role', async () => {
    const caller = appRouter.createCaller({
      ...baseCtx,
      authUserId: 'user-1',
      roles: ['user'],
    } as never);
    await expect(
      caller.research.judgments.search({ query: 'privacy' }),
    ).rejects.toMatchObject<Partial<TRPCError>>({
      code: 'FORBIDDEN',
    });
  });

  it('research.judgments.summarize is PRECONDITION_FAILED when OpenAI is not configured', async () => {
    const row = {
      id: '44c0ffee-bbab-4144-8ddd-001122334401',
      title: 'Test',
      court: 'SC',
      decisionAt: null as Date | null,
      citation: 'AIR 1',
      summaryExcerpt: 'Short',
      bodyForSearch: 'Body',
      topics: [] as string[],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const db = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([row]),
          }),
        }),
      }),
    };
    const caller = appRouter.createCaller({
      ...baseCtx,
      authUserId: 'lawyer-1',
      roles: ['user', 'lawyer'],
      db: db as never,
    } as never);
    await expect(
      caller.research.judgments.summarize({
        id: '44c0ffee-bbab-4144-8ddd-001122334401',
      }),
    ).rejects.toMatchObject<Partial<TRPCError>>({
      code: 'PRECONDITION_FAILED',
    });
  });

  it('research.statutes.crosswalk returns seeded IPC to BNS mapping', async () => {
    const crossRow = {
      sourceStatute: 'IPC',
      sourceSection: '302',
      targetStatute: 'BNS',
      targetSection: '103',
      note: 'Illustrative',
      createdAt: new Date(),
    };
    const db = {
      select: () => ({
        from: () => ({
          where: () => Promise.resolve([crossRow]),
        }),
      }),
    };
    const caller = appRouter.createCaller({
      ...baseCtx,
      authUserId: 'lawyer-1',
      roles: ['user', 'lawyer'],
      db: db as never,
    } as never);
    const out = await caller.research.statutes.crosswalk({
      sourceStatute: 'IPC',
      sourceSection: '302',
      targetStatute: 'BNS',
    });
    expect(out.rows).toHaveLength(1);
    expect(out.rows[0]?.targetSection).toBe('103');
  });
});
