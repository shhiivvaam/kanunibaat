import { appRouter } from '@kb/trpc';

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

    const caller = appRouter.createCaller({
      db: db as never,
      authUserId: 'user-1',
      roles: ['user'],
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
    } as never);

    await caller.qa.vote.set({
      questionId: '00000000-0000-0000-0000-000000000000',
      value: 'up',
    });

    expect(calls).toEqual([{ kind: 'upsert' }]);
  });
});
