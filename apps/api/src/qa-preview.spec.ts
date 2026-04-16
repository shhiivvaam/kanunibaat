import { TRPCError } from '@trpc/server';

import {
  appRouter,
  generateQaPreviewWithOpenAI,
  qaAiPreviewSchema,
} from '@kb/trpc';

describe('Phase 12 Q&A', () => {
  it('AI preview schema accepts expected shape', () => {
    const parsed = qaAiPreviewSchema.safeParse({
      summary: 'Summary',
      steps: ['A', 'B', 'C'],
      applicable_laws: ['Consumer Protection Act, 2019'],
      disclaimer: 'General information only.',
    });
    expect(parsed.success).toBe(true);
  });

  it('generateQaPreviewWithOpenAI rejects non-JSON model output', async () => {
    const origFetch = global.fetch;
    global.fetch = jest.fn(async () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: 'not json' } }],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    );
    try {
      await expect(
        generateQaPreviewWithOpenAI({
          apiKey: 'test',
          title: 'Test title',
          body: 'Test body',
          locale: 'en',
        }),
      ).rejects.toThrow('non-JSON');
    } finally {
      global.fetch = origFetch;
    }
  });

  it('qa.question.aiPreview is PRECONDITION_FAILED when OpenAI is not configured', async () => {
    const baseCtx = {
      db: {
        select: () => ({
          from: () => ({
            where: () => ({
              limit: () =>
                Promise.resolve([
                  {
                    id: '00000000-0000-0000-0000-000000000000',
                    title: 'Title',
                    body: 'Body text',
                    status: 'open',
                    aiPreviewJson: null,
                  },
                ]),
            }),
          }),
        }),
      } as never,
      authUserId: 'user-1',
      roles: ['user'] as const,
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

    const caller = appRouter.createCaller(baseCtx as never);
    await expect(
      caller.qa.question.aiPreview({
        id: '00000000-0000-0000-0000-000000000000',
        locale: 'en',
      }),
    ).rejects.toMatchObject<Partial<TRPCError>>({
      code: 'PRECONDITION_FAILED',
    });
  });
});
