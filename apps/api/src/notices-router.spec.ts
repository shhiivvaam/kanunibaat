import { TRPCError } from '@trpc/server';

import { appRouter } from '@kb/trpc';

describe('Phase 4 notices router', () => {
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
  };

  it('requestUpload fails clearly when storage is not configured', async () => {
    const caller = appRouter.createCaller(baseCtx as never);
    await expect(
      caller.notices.requestUpload({
        fileName: 'notice.pdf',
        contentType: 'application/pdf',
        byteSize: 123,
        locale: 'en',
      }),
    ).rejects.toMatchObject<Partial<TRPCError>>({
      code: 'PRECONDITION_FAILED',
    });
  });

  it('process fails clearly when OCR is not configured', async () => {
    const caller = appRouter.createCaller(baseCtx as never);
    await expect(
      caller.notices.process({
        scanId: '00000000-0000-0000-0000-000000000000',
        accessToken: '00000000-0000-0000-0000-000000000000',
      }),
    ).rejects.toMatchObject<Partial<TRPCError>>({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });

  it('listMine returns empty for anonymous users', async () => {
    const caller = appRouter.createCaller(baseCtx as never);
    const res = await caller.notices.listMine();
    expect(res.scans).toEqual([]);
  });
});
