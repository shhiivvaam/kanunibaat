import { randomUUID, createHash } from 'node:crypto';

import { TRPCError } from '@trpc/server';
import { and, desc, eq, gte } from 'drizzle-orm';
import { z } from 'zod';

import { noticeScan } from '@kb/database/schema';
import { fetchObjectBytes, noticeScanObjectKey, presignPutNoticeObject, StorageNotConfiguredError } from '@kb/storage';

import { publicProcedure, router } from '../init';
import { computeEntitlementsForUser, incrementUsageMeter, monthStartUtc } from '../billing/entitlements';
import { ocrWithGoogleVision } from '../notices/google-vision';
import { analyzeNoticeWithOpenAI } from '../notices/openai-analyze';

const MAX_SCAN_BYTES = 10 * 1024 * 1024;

function computeAnonKey(ip: string | null, ua: string | null): string | null {
  if (!ip && !ua) return null;
  const raw = `${ip ?? ''}|${ua ?? ''}`;
  return createHash('sha256').update(raw).digest('hex');
}

const requestUploadSchema = z.object({
  fileName: z.string().min(1).max(200),
  contentType: z.string().min(1).max(120),
  byteSize: z.number().int().positive(),
  locale: z.string().min(2).max(16).optional().default('en'),
});

const confirmUploadSchema = z.object({
  scanId: z.string().uuid(),
  accessToken: z.string().uuid(),
});

const processSchema = z.object({
  scanId: z.string().uuid(),
  accessToken: z.string().uuid(),
});

const getSchema = z.object({
  scanId: z.string().uuid(),
  accessToken: z.string().uuid(),
});

export const noticesRouter = router({
  requestUpload: publicProcedure.input(requestUploadSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.s3Documents) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: new StorageNotConfiguredError().message,
      });
    }

    const now = new Date();
    const userId = ctx.authUserId;
    const anonKey = userId ? null : computeAnonKey(ctx.requestIp, ctx.userAgent);

    // Enforce plan limits for authenticated users, and free tier for anonymous (best-effort).
    const start = monthStartUtc(now);
    if (userId) {
      const ent = await computeEntitlementsForUser({ db: ctx.db, userId, now });
      const limit = ent.limits.noticeScansPerMonth;
      if (limit != null && ent.usage.noticeScansThisPeriod >= limit) {
        throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: `Monthly limit reached (${limit} scans). Upgrade for unlimited.` });
      }
    } else if (anonKey) {
      const rows = await ctx.db
        .select({ id: noticeScan.id })
        .from(noticeScan)
        .where(and(eq(noticeScan.anonKey, anonKey), gte(noticeScan.createdAt, start)))
        .limit(3);
      if (rows.length >= 2) {
        throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Free tier limit reached (2 scans/month). Sign in and upgrade for more.' });
      }
    }

    if (input.byteSize > MAX_SCAN_BYTES) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Max file size is 10MB.' });
    }

    const scanId = randomUUID();
    const accessToken = randomUUID();
    const key = noticeScanObjectKey(scanId, input.fileName);

    await ctx.db.insert(noticeScan).values({
      id: scanId,
      userId: userId ?? null,
      accessToken,
      anonKey,
      storageKey: key,
      fileName: input.fileName,
      contentType: input.contentType,
      byteSize: input.byteSize,
      status: 'uploaded',
      locale: input.locale,
      createdAt: now,
      updatedAt: now,
    });

    if (userId) {
      await incrementUsageMeter({ db: ctx.db, userId, meterKey: 'notice_scans', periodStartAt: start });
    }

    const { url } = await presignPutNoticeObject(ctx.s3Documents, {
      key,
      contentType: input.contentType,
      contentLength: input.byteSize,
    });

    return { scanId, accessToken, uploadUrl: url };
  }),

  confirmUpload: publicProcedure.input(confirmUploadSchema).mutation(async ({ ctx, input }) => {
    const [row] = await ctx.db
      .select()
      .from(noticeScan)
      .where(and(eq(noticeScan.id, input.scanId), eq(noticeScan.accessToken, input.accessToken)))
      .limit(1);
    if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Scan not found.' });

    await ctx.db
      .update(noticeScan)
      .set({ uploadedAt: new Date(), status: 'processing', updatedAt: new Date() })
      .where(eq(noticeScan.id, input.scanId));

    return { ok: true as const };
  }),

  process: publicProcedure.input(processSchema).mutation(async ({ ctx, input }) => {
    const [row] = await ctx.db
      .select()
      .from(noticeScan)
      .where(and(eq(noticeScan.id, input.scanId), eq(noticeScan.accessToken, input.accessToken)))
      .limit(1);
    if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Scan not found.' });

    if (!ctx.s3Documents) {
      throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Storage not configured.' });
    }
    if (!ctx.googleVisionApiKey) {
      throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'OCR is not configured.' });
    }

    try {
      const { bytes } = await fetchObjectBytes(ctx.s3Documents, row.storageKey, MAX_SCAN_BYTES);
      const ocr = await ocrWithGoogleVision(ctx.googleVisionApiKey, bytes);

      let analysis:
        | {
          notice_type: string;
          issuing_authority?: string | null;
          is_likely_genuine?: boolean | null;
          plain_summary: string;
          recommended_actions: string[];
          recommended_lawyer_type: string;
          deadline_date_iso?: string | null;
          amount_inr?: number | null;
        }
        | null = null;

      if (ctx.openaiApiKey) {
        analysis = await analyzeNoticeWithOpenAI(ctx.openaiApiKey, ocr.text, row.locale);
      }

      const deadline = analysis?.deadline_date_iso ? new Date(analysis.deadline_date_iso) : null;
      const isLikely =
        analysis?.is_likely_genuine == null ? null : analysis.is_likely_genuine ? 1 : 0;

      await ctx.db
        .update(noticeScan)
        .set({
          status: 'completed',
          ocrText: ocr.text,
          noticeType: analysis?.notice_type ?? null,
          issuingAuthority: analysis?.issuing_authority ?? null,
          isLikelyGenuine: isLikely,
          deadlineDate: deadline,
          amountInr: analysis?.amount_inr ?? null,
          aiSummary:
            analysis?.plain_summary ??
            'Text extracted. AI summary is not configured. This is general information, not legal advice.',
          recommendedActions: analysis?.recommended_actions ?? [],
          recommendedLawyerType: analysis?.recommended_lawyer_type ?? null,
          failureReason: null,
          updatedAt: new Date(),
        })
        .where(eq(noticeScan.id, row.id));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Processing failed.';
      await ctx.db
        .update(noticeScan)
        .set({ status: 'failed', failureReason: msg, updatedAt: new Date() })
        .where(eq(noticeScan.id, row.id));
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: msg });
    }

    const [out] = await ctx.db
      .select()
      .from(noticeScan)
      .where(eq(noticeScan.id, row.id))
      .limit(1);
    return { scan: out ?? null };
  }),

  get: publicProcedure.input(getSchema).query(async ({ ctx, input }) => {
    const [row] = await ctx.db
      .select()
      .from(noticeScan)
      .where(and(eq(noticeScan.id, input.scanId), eq(noticeScan.accessToken, input.accessToken)))
      .limit(1);
    if (!row) return { scan: null };
    return { scan: row };
  }),

  listMine: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.authUserId) {
      return { scans: [] };
    }
    const rows = await ctx.db
      .select()
      .from(noticeScan)
      .where(eq(noticeScan.userId, ctx.authUserId))
      .orderBy(desc(noticeScan.createdAt))
      .limit(20);
    return { scans: rows };
  }),
});

