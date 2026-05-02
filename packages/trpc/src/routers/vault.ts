import { randomUUID } from 'node:crypto';

import { TRPCError } from '@trpc/server';
import { and, desc, eq, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { z } from 'zod';

import type * as DbSchema from '@jurisly/database/schema';
import { vaultDocument, vaultFolder, vaultShare } from '@jurisly/database/schema';
import {
  deleteVaultObject,
  headVaultObject,
  MAX_VAULT_OBJECT_BYTES,
  presignGetVaultObject,
  presignPutVaultObject,
  StorageNotConfiguredError,
  vaultDocumentObjectKey,
} from '@jurisly/storage';

import { protectedProcedure, publicProcedure, router } from '../init';
import { computeEntitlementsForUser } from '../billing/entitlements';
import { summarizeVaultPlaintextWithOpenAI } from '../vault/openai-summarize';
import { scanVaultDocument } from '../vault/malware-scan';

const EXPIRING_SOON_DAYS = 30;
const MAX_EXPIRY_YEARS = 10;

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
  'application/octet-stream',
] as const;

const vaultCategorySchema = z.enum([
  'property',
  'family',
  'financial',
  'wills',
  'employment',
  'court',
  'identity',
  'rental',
  'business',
  'insurance',
  'other',
]);

async function loadVaultUsage(
  db: PostgresJsDatabase<typeof DbSchema>,
  userId: string,
): Promise<{ completeCount: number; totalBytes: number }> {
  const [row] = await db
    .select({
      completeCount: sql<number>`count(*)::int`,
      totalBytes: sql<number>`coalesce(sum(${vaultDocument.byteSize}), 0)::int`,
    })
    .from(vaultDocument)
    .where(and(eq(vaultDocument.userId, userId), eq(vaultDocument.uploadStatus, 'complete')));
  return {
    completeCount: row?.completeCount ?? 0,
    totalBytes: row?.totalBytes ?? 0,
  };
}

async function assertFolderOwned(
  db: PostgresJsDatabase<typeof DbSchema>,
  userId: string,
  folderId: string,
): Promise<void> {
  const [f] = await db
    .select({ id: vaultFolder.id })
    .from(vaultFolder)
    .where(and(eq(vaultFolder.id, folderId), eq(vaultFolder.userId, userId)))
    .limit(1);
  if (!f) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Folder not found.' });
  }
}

function isExpiringSoon(expiresAt: Date | null, now: Date): boolean {
  if (!expiresAt) return false;
  const threshold = new Date(now.getTime() + EXPIRING_SOON_DAYS * 86_400_000);
  return expiresAt <= threshold && expiresAt >= now;
}

export const vaultRouter = router({
  folder: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.authUserId;
      const rows = await ctx.db
        .select()
        .from(vaultFolder)
        .where(eq(vaultFolder.userId, userId))
        .orderBy(vaultFolder.name);
      return { folders: rows };
    }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(120),
          parentFolderId: z.string().uuid().nullable().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.authUserId;
        if (input.parentFolderId) {
          await assertFolderOwned(ctx.db, userId, input.parentFolderId);
        }
        const [created] = await ctx.db
          .insert(vaultFolder)
          .values({
            userId,
            name: input.name,
            parentFolderId: input.parentFolderId ?? null,
            updatedAt: new Date(),
          })
          .returning();
        return { folder: created ?? null };
      }),

    rename: protectedProcedure
      .input(z.object({ id: z.string().uuid(), name: z.string().min(1).max(120) }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.authUserId;
        const [updated] = await ctx.db
          .update(vaultFolder)
          .set({ name: input.name, updatedAt: new Date() })
          .where(and(eq(vaultFolder.id, input.id), eq(vaultFolder.userId, userId)))
          .returning();
        if (!updated) throw new TRPCError({ code: 'NOT_FOUND', message: 'Folder not found.' });
        return { folder: updated };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.authUserId;
        const [child] = await ctx.db
          .select({ id: vaultFolder.id })
          .from(vaultFolder)
          .where(and(eq(vaultFolder.userId, userId), eq(vaultFolder.parentFolderId, input.id)))
          .limit(1);
        if (child) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Folder is not empty (contains subfolders).',
          });
        }
        const [doc] = await ctx.db
          .select({ id: vaultDocument.id })
          .from(vaultDocument)
          .where(and(eq(vaultDocument.userId, userId), eq(vaultDocument.folderId, input.id)))
          .limit(1);
        if (doc) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Folder is not empty (contains documents).',
          });
        }
        const [deleted] = await ctx.db
          .delete(vaultFolder)
          .where(and(eq(vaultFolder.id, input.id), eq(vaultFolder.userId, userId)))
          .returning();
        if (!deleted) throw new TRPCError({ code: 'NOT_FOUND', message: 'Folder not found.' });
        return { ok: true as const };
      }),
  }),

  document: router({
    requestUpload: protectedProcedure
      .input(
        z.object({
          displayName: z.string().min(1).max(200),
          folderId: z.string().uuid().nullable().optional(),
          category: vaultCategorySchema,
          tags: z.array(z.string().min(1).max(64)).max(24).default([]),
          expiresAt: z.coerce.date().nullable().optional(),
          byteSize: z.number().int().positive().max(MAX_VAULT_OBJECT_BYTES),
          contentType: z.string().min(1).max(120),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.s3Documents) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: new StorageNotConfiguredError().message,
          });
        }

        if (
          !ALLOWED_MIME_TYPES.includes(input.contentType as (typeof ALLOWED_MIME_TYPES)[number])
        ) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `File type not allowed: ${input.contentType}. Please upload PDF, images, Office documents, or text files.`,
          });
        }

        if (input.expiresAt) {
          const maxExpiry = new Date();
          maxExpiry.setFullYear(maxExpiry.getFullYear() + MAX_EXPIRY_YEARS);
          if (input.expiresAt > maxExpiry) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Expiry date cannot be more than ${MAX_EXPIRY_YEARS} years in the future.`,
            });
          }
        }

        const userId = ctx.authUserId;
        if (input.folderId) {
          await assertFolderOwned(ctx.db, userId, input.folderId);
        }
        const now = new Date();
        const ent = await computeEntitlementsForUser({ db: ctx.db, userId, now });
        const usage = await loadVaultUsage(ctx.db, userId);
        const docsMax = ent.limits.vaultDocsMax;
        const bytesMax = ent.limits.vaultStorageBytesMax;
        if (docsMax != null && usage.completeCount >= docsMax) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: `Vault document limit reached (${docsMax}). Upgrade for more.`,
          });
        }
        if (bytesMax != null && usage.totalBytes + input.byteSize > bytesMax) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'Vault storage limit reached. Upgrade for more storage.',
          });
        }

        const documentId = randomUUID();
        const storageKey = vaultDocumentObjectKey(userId, documentId);

        await ctx.db.insert(vaultDocument).values({
          id: documentId,
          userId,
          folderId: input.folderId ?? null,
          category: input.category,
          displayName: input.displayName,
          tags: input.tags,
          storageKey,
          byteSize: input.byteSize,
          contentType: input.contentType,
          expiresAt: input.expiresAt ?? null,
          uploadStatus: 'pending',
          updatedAt: now,
        });

        const { url } = await presignPutVaultObject(ctx.s3Documents, {
          key: storageKey,
          contentType: input.contentType,
          contentLength: input.byteSize,
        });

        return { documentId, uploadUrl: url, storageKey };
      }),

    confirmUpload: protectedProcedure
      .input(
        z.object({
          documentId: z.string().uuid(),
          wrappedDek: z.string().min(1).max(8192),
          keyWrapSalt: z.string().min(1).max(256),
          byteSize: z.number().int().positive().max(MAX_VAULT_OBJECT_BYTES),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.authUserId;
        const [row] = await ctx.db
          .select()
          .from(vaultDocument)
          .where(and(eq(vaultDocument.id, input.documentId), eq(vaultDocument.userId, userId)))
          .limit(1);
        if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found.' });
        if (row.uploadStatus !== 'pending') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Upload already confirmed.' });
        }
        if (row.byteSize !== input.byteSize) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Byte size does not match upload request.',
          });
        }

        if (!ctx.s3Documents) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: new StorageNotConfiguredError().message,
          });
        }

        // Server-side size verification using S3 HeadObject API
        const s3Metadata = await headVaultObject(ctx.s3Documents, row.storageKey);
        if (s3Metadata.contentLength !== input.byteSize) {
          // Size mismatch - client lied or upload failed
          await deleteVaultObject(ctx.s3Documents, row.storageKey);
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Actual uploaded size (${s3Metadata.contentLength} bytes) does not match reported size (${input.byteSize} bytes).`,
          });
        }

        // Malware scanning hook
        const scanResult = await scanVaultDocument(row.storageKey, input.byteSize);
        if (!scanResult.clean) {
          // Malware detected - delete S3 object and database record
          await deleteVaultObject(ctx.s3Documents, row.storageKey);
          await ctx.db.delete(vaultDocument).where(eq(vaultDocument.id, input.documentId));
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Upload rejected: ${scanResult.threatName ?? 'Security threat detected'}`,
          });
        }

        const ent = await computeEntitlementsForUser({ db: ctx.db, userId, now: new Date() });
        const docsMax = ent.limits.vaultDocsMax;
        const bytesMax = ent.limits.vaultStorageBytesMax;
        const usage = await loadVaultUsage(ctx.db, userId);
        if (docsMax != null && usage.completeCount >= docsMax) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: `Vault document limit reached (${docsMax}). Upgrade for more.`,
          });
        }
        if (bytesMax != null && usage.totalBytes + input.byteSize > bytesMax) {
          throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: 'Vault storage limit reached. Upgrade for more storage.',
          });
        }

        const now = new Date();
        await ctx.db
          .update(vaultDocument)
          .set({
            uploadStatus: 'complete',
            wrappedDek: input.wrappedDek,
            keyWrapSalt: input.keyWrapSalt,
            updatedAt: now,
          })
          .where(eq(vaultDocument.id, input.documentId));

        return { ok: true as const };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.authUserId;
      const now = new Date();
      const rows = await ctx.db
        .select()
        .from(vaultDocument)
        .where(eq(vaultDocument.userId, userId))
        .orderBy(desc(vaultDocument.createdAt));

      const ent = await computeEntitlementsForUser({ db: ctx.db, userId, now });
      const usage = await loadVaultUsage(ctx.db, userId);

      return {
        documents: rows.map((d) => ({
          ...d,
          expiringSoon: isExpiringSoon(d.expiresAt ?? null, now),
        })),
        usage: {
          completeCount: usage.completeCount,
          totalBytes: usage.totalBytes,
          maxDocuments: ent.limits.vaultDocsMax,
          maxTotalBytes: ent.limits.vaultStorageBytesMax,
        },
      };
    }),

    update: protectedProcedure
      .input(
        z.object({
          documentId: z.string().uuid(),
          displayName: z.string().min(1).max(200).optional(),
          tags: z.array(z.string().min(1).max(64)).max(24).optional(),
          folderId: z.string().uuid().nullable().optional(),
          expiresAt: z.coerce.date().nullable().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.authUserId;
        const [row] = await ctx.db
          .select()
          .from(vaultDocument)
          .where(and(eq(vaultDocument.id, input.documentId), eq(vaultDocument.userId, userId)))
          .limit(1);
        if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found.' });

        if (input.folderId) {
          await assertFolderOwned(ctx.db, userId, input.folderId);
        }

        const patch: Partial<typeof vaultDocument.$inferInsert> = { updatedAt: new Date() };
        if (input.displayName !== undefined) patch.displayName = input.displayName;
        if (input.tags !== undefined) patch.tags = input.tags;
        if (input.folderId !== undefined) patch.folderId = input.folderId;
        if (input.expiresAt !== undefined) patch.expiresAt = input.expiresAt;

        const [updated] = await ctx.db
          .update(vaultDocument)
          .set(patch)
          .where(eq(vaultDocument.id, input.documentId))
          .returning();
        return { document: updated ?? null };
      }),

    delete: protectedProcedure
      .input(z.object({ documentId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.authUserId;
        const [row] = await ctx.db
          .select()
          .from(vaultDocument)
          .where(and(eq(vaultDocument.id, input.documentId), eq(vaultDocument.userId, userId)))
          .limit(1);
        if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found.' });

        if (ctx.s3Documents) {
          try {
            await deleteVaultObject(ctx.s3Documents, row.storageKey);
          } catch {
            // best-effort delete
          }
        }
        await ctx.db.delete(vaultDocument).where(eq(vaultDocument.id, input.documentId));
        return { ok: true as const };
      }),

    presignDownload: protectedProcedure
      .input(z.object({ documentId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.s3Documents) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: new StorageNotConfiguredError().message,
          });
        }
        const userId = ctx.authUserId;
        const [row] = await ctx.db
          .select()
          .from(vaultDocument)
          .where(and(eq(vaultDocument.id, input.documentId), eq(vaultDocument.userId, userId)))
          .limit(1);
        if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found.' });
        if (row.uploadStatus !== 'complete') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Upload not complete.' });
        }
        const { url } = await presignGetVaultObject(ctx.s3Documents, {
          key: row.storageKey,
        });
        return { downloadUrl: url };
      }),

    summarize: protectedProcedure
      .input(
        z.object({
          plaintext: z.string().min(1).max(16_000),
          locale: z.string().min(2).max(16).optional().default('en'),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const ent = await computeEntitlementsForUser({
          db: ctx.db,
          userId: ctx.authUserId,
          now: new Date(),
        });
        if (!ent.limits.aiEnabled) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'AI insights require a paid plan.' });
        }
        if (!ctx.openaiApiKey) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'AI summary is not configured.',
          });
        }
        try {
          const ai = await summarizeVaultPlaintextWithOpenAI(
            ctx.openaiApiKey,
            input.plaintext,
            input.locale,
          );
          return { summary: ai.summary, bullets: ai.bullets };
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Summary failed.';
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: msg });
        }
      }),
  }),

  share: router({
    list: protectedProcedure
      .input(z.object({ documentId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const userId = ctx.authUserId;
        const [doc] = await ctx.db
          .select({ id: vaultDocument.id })
          .from(vaultDocument)
          .where(and(eq(vaultDocument.id, input.documentId), eq(vaultDocument.userId, userId)))
          .limit(1);
        if (!doc) throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found.' });

        const rows = await ctx.db
          .select()
          .from(vaultShare)
          .where(eq(vaultShare.documentId, input.documentId))
          .orderBy(desc(vaultShare.createdAt));
        return { shares: rows };
      }),

    create: protectedProcedure
      .input(
        z.object({
          documentId: z.string().uuid(),
          expiresAt: z.coerce.date(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.authUserId;
        const [doc] = await ctx.db
          .select()
          .from(vaultDocument)
          .where(and(eq(vaultDocument.id, input.documentId), eq(vaultDocument.userId, userId)))
          .limit(1);
        if (!doc) throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found.' });
        if (doc.uploadStatus !== 'complete') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Document upload not complete.' });
        }
        if (input.expiresAt.getTime() <= Date.now()) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Share expiry must be in the future.',
          });
        }

        const [share] = await ctx.db
          .insert(vaultShare)
          .values({
            documentId: input.documentId,
            expiresAt: input.expiresAt,
          })
          .returning();

        if (!share)
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Share creation failed.' });

        return {
          shareId: share.id,
          accessToken: share.accessToken,
          webPath: `/vault/shared/${share.accessToken}`,
        };
      }),

    revoke: protectedProcedure
      .input(z.object({ shareId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.authUserId;
        const [shareRow] = await ctx.db
          .select()
          .from(vaultShare)
          .where(eq(vaultShare.id, input.shareId))
          .limit(1);
        if (!shareRow) throw new TRPCError({ code: 'NOT_FOUND', message: 'Share not found.' });
        const [doc] = await ctx.db
          .select({ id: vaultDocument.id })
          .from(vaultDocument)
          .where(and(eq(vaultDocument.id, shareRow.documentId), eq(vaultDocument.userId, userId)))
          .limit(1);
        if (!doc) throw new TRPCError({ code: 'NOT_FOUND', message: 'Share not found.' });

        const now = new Date();
        await ctx.db
          .update(vaultShare)
          .set({ revokedAt: now })
          .where(eq(vaultShare.id, input.shareId));
        return { ok: true as const };
      }),

    get: publicProcedure
      .input(z.object({ token: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.s3Documents) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: new StorageNotConfiguredError().message,
          });
        }
        const now = new Date();
        const [share] = await ctx.db
          .select()
          .from(vaultShare)
          .where(eq(vaultShare.accessToken, input.token))
          .limit(1);

        if (!share) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Share link not found or expired.' });
        }
        const [doc] = await ctx.db
          .select()
          .from(vaultDocument)
          .where(eq(vaultDocument.id, share.documentId))
          .limit(1);
        if (!doc) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Share link not found or expired.' });
        }
        if (share.revokedAt) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Share link not found or expired.' });
        }
        if (share.expiresAt.getTime() <= now.getTime()) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Share link not found or expired.' });
        }
        if (doc.uploadStatus !== 'complete') {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Share link not found or expired.' });
        }
        if (!doc.wrappedDek || !doc.keyWrapSalt) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Share link not found or expired.' });
        }

        const { url } = await presignGetVaultObject(ctx.s3Documents, {
          key: doc.storageKey,
        });

        return {
          displayName: doc.displayName,
          category: doc.category,
          contentType: doc.contentType,
          byteSize: doc.byteSize,
          documentExpiresAt: doc.expiresAt,
          shareExpiresAt: share.expiresAt,
          downloadUrl: url,
          /** Lets the recipient decrypt locally with the vault passphrase (never logged server-side). */
          wrappedDek: doc.wrappedDek,
          keyWrapSalt: doc.keyWrapSalt,
        };
      }),
  }),
});
