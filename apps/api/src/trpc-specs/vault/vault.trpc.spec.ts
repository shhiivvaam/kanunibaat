import { TRPCError } from '@trpc/server';

import { appRouter } from '@jurisly/trpc';

import { trpcTestBaseCtx } from '../../test-utils/trpc-test-context';

describe('Phase 7 vault router', () => {
  const baseCtx = trpcTestBaseCtx();

  it('document.requestUpload fails when storage is not configured', async () => {
    const caller = appRouter.createCaller({
      ...baseCtx,
      authUserId: 'user-1',
    } as never);
    await expect(
      caller.vault.document.requestUpload({
        displayName: 'Lease',
        folderId: null,
        category: 'rental',
        tags: [],
        expiresAt: null,
        byteSize: 500,
        contentType: 'application/pdf',
      }),
    ).rejects.toMatchObject<Partial<TRPCError>>({
      code: 'PRECONDITION_FAILED',
    });
  });

  it('document.requestUpload fails when free document quota is exhausted', async () => {
    const db = {
      select() {
        return {
          from() {
            return {
              where() {
                return Promise.resolve([{ completeCount: 5, totalBytes: 0 }]);
              },
            };
          },
        };
      },
    };
    const caller = appRouter.createCaller({
      ...baseCtx,
      authUserId: 'user-1',
      s3Documents: {
        region: 'ap-south-1',
        bucket: 'b',
        accessKeyId: 'a',
        secretAccessKey: 's',
      },
      db: db as never,
    } as never);
    await expect(
      caller.vault.document.requestUpload({
        displayName: 'Extra',
        folderId: null,
        category: 'other',
        tags: [],
        expiresAt: null,
        byteSize: 100,
        contentType: 'application/pdf',
      }),
    ).rejects.toMatchObject<Partial<TRPCError>>({
      code: 'TOO_MANY_REQUESTS',
    });
  });

  it('share.get fails for unknown token', async () => {
    const db = {
      select() {
        return {
          from() {
            return {
              where() {
                return {
                  limit() {
                    return Promise.resolve([]);
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
      s3Documents: {
        region: 'ap-south-1',
        bucket: 'b',
        accessKeyId: 'a',
        secretAccessKey: 's',
      },
      db: db as never,
    } as never);
    await expect(
      caller.vault.share.get({ token: '00000000-0000-0000-0000-000000000000' }),
    ).rejects.toMatchObject<Partial<TRPCError>>({
      code: 'NOT_FOUND',
    });
  });

  it('document.summarize is FORBIDDEN without paid AI entitlement', async () => {
    const caller = appRouter.createCaller({
      ...baseCtx,
      authUserId: 'user-1',
      openaiApiKey: null,
    } as never);
    await expect(
      caller.vault.document.summarize({
        plaintext: 'Sample notice text for vault.',
        locale: 'en',
      }),
    ).rejects.toMatchObject<Partial<TRPCError>>({
      code: 'FORBIDDEN',
    });
  });
});
