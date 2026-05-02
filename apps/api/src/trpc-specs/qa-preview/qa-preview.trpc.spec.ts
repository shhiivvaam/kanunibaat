import { TRPCError } from '@trpc/server';

import {
  appRouter,
  generateQaPreviewWithOpenAI,
  qaAiPreviewSchema,
} from '@jurisly/trpc';
import * as billingEntitlements from '../../../../../packages/trpc/dist/billing/entitlements';

import { trpcTestBaseCtx } from '../../test-utils/trpc-test-context';

describe('Phase 12 Q&A', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

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

  it('qa.question.aiPreview is FORBIDDEN without AI entitlement (free tier)', async () => {
    const db = {
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
    } as never;

    const caller = appRouter.createCaller(
      trpcTestBaseCtx({
        db,
        authUserId: 'user-1',
        roles: ['user'],
      }) as never,
    );
    await expect(
      caller.qa.question.aiPreview({
        id: '00000000-0000-0000-0000-000000000000',
        locale: 'en',
      }),
    ).rejects.toMatchObject<Partial<TRPCError>>({
      code: 'FORBIDDEN',
      message: 'AI features require Pro plan',
    });
  });

  it('qa.question.aiPreview is PRECONDITION_FAILED when entitled but OpenAI is not configured', async () => {
    const proAiEntitlements: Awaited<
      ReturnType<typeof billingEntitlements.computeEntitlementsForUser>
    > = {
      planKey: 'pro',
      limits: {
        noticeScansPerMonth: null,
        vaultDocsMax: null,
        vaultStorageBytesMax: 5 * 1024 * 1024 * 1024,
        caseTrackerEnabled: true,
        aiEnabled: true,
        priorityMatching: true,
      },
      usage: {
        noticeScansThisPeriod: 0,
        noticeScansRemaining: null,
        periodStartAt: new Date('2026-04-01T00:00:00.000Z'),
      },
    };
    jest
      .spyOn(billingEntitlements, 'computeEntitlementsForUser')
      .mockResolvedValue(proAiEntitlements);

    const db = {
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
    } as never;

    const caller = appRouter.createCaller(
      trpcTestBaseCtx({
        db,
        authUserId: 'user-1',
        roles: ['user'],
      }) as never,
    );
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
