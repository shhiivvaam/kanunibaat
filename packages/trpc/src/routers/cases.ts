import { randomUUID } from 'node:crypto';

import { TRPCError } from '@trpc/server';
import type { SQL } from 'drizzle-orm';
import { and, desc, eq, gte, ilike, isNotNull, lte, or } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { z } from 'zod';

import type * as DbSchema from '@kb/database/schema';
import {
  lawyerCase,
  lawyerCaseDocument,
  lawyerCaseHearing,
  lawyerCaseTask,
  lawyerClient,
  notificationJob,
} from '@kb/database/schema';
import {
  caseDocumentObjectKey,
  deleteCaseDocumentObject,
  presignGetCaseDocumentObject,
  presignPutObject,
  StorageNotConfiguredError,
} from '@kb/storage';

import { fetchCourtSnapshotViaBridge, normalizeAndValidateCnr } from '../cases/njdg-lookup';
import { makeDedupeKey } from '../notifications/payload';
import { computeReminderTimes, HEARING_REMINDER_OFFSETS_MS } from '../notifications/schedule';
import { lawyerProcedure, router } from '../init';

async function upsertReminderJobsForHearing(opts: {
  db: PostgresJsDatabase<typeof DbSchema>;
  userId: string;
  hearingId: string;
  hearingAt: Date;
  caseId: string;
}): Promise<void> {
  const now = new Date();
  const times = computeReminderTimes({ at: opts.hearingAt, now, offsetsMs: HEARING_REMINDER_OFFSETS_MS });
  for (const t of times) {
    const offsetMs = opts.hearingAt.getTime() - t.getTime();
    const dedupeKey = makeDedupeKey(['hearing', opts.hearingId, offsetMs]);
    await opts.db
      .insert(notificationJob)
      .values({
        userId: opts.userId,
        kind: 'hearing_reminder',
        dedupeKey,
        scheduledAt: t,
        payloadJson: {
          title: 'Hearing reminder',
          body: 'Upcoming hearing scheduled.',
          url: `/app/practice/cases/${opts.caseId}`,
          mobilePath: `/practice/${opts.caseId}`,
          data: { caseId: opts.caseId, hearingId: opts.hearingId, hearingAt: opts.hearingAt.toISOString() },
        },
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: notificationJob.dedupeKey,
        set: {
          scheduledAt: t,
          status: 'pending',
          sentAt: null,
          payloadJson: {
            title: 'Hearing reminder',
            body: 'Upcoming hearing scheduled.',
            url: `/app/practice/cases/${opts.caseId}`,
            mobilePath: `/practice/${opts.caseId}`,
            data: { caseId: opts.caseId, hearingId: opts.hearingId, hearingAt: opts.hearingAt.toISOString() },
          },
          updatedAt: now,
        },
      });
  }
}

const courtTypeSchema = z.enum(['district', 'high_court', 'supreme_court', 'tribunal', 'other']);
const caseStatusSchema = z.enum([
  'intake',
  'active',
  'hearing_scheduled',
  'pending_docs',
  'judgement',
  'closed',
  'appealed',
]);
const caseOutcomeSchema = z.enum(['unknown', 'won', 'lost', 'settled', 'withdrawn']);
const taskPrioritySchema = z.enum(['low', 'normal', 'high']);
const taskStatusSchema = z.enum(['open', 'done']);

async function loadCaseForLawyer(
  db: PostgresJsDatabase<typeof DbSchema>,
  lawyerUserId: string,
  caseId: string,
) {
  const [row] = await db
    .select()
    .from(lawyerCase)
    .where(and(eq(lawyerCase.id, caseId), eq(lawyerCase.lawyerUserId, lawyerUserId)))
    .limit(1);
  if (!row) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Case not found.' });
  }
  return row;
}

async function assertClientOwned(
  db: PostgresJsDatabase<typeof DbSchema>,
  lawyerUserId: string,
  clientId: string,
): Promise<typeof lawyerClient.$inferSelect> {
  const [row] = await db
    .select()
    .from(lawyerClient)
    .where(and(eq(lawyerClient.id, clientId), eq(lawyerClient.lawyerUserId, lawyerUserId)))
    .limit(1);
  if (!row) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found.' });
  }
  return row;
}

function escapeLikePattern(s: string): string {
  return s.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
}

export const casesRouter = router({
  client: router({
    list: lawyerProcedure.query(async ({ ctx }) => {
      const rows = await ctx.db
        .select()
        .from(lawyerClient)
        .where(eq(lawyerClient.lawyerUserId, ctx.authUserId))
        .orderBy(desc(lawyerClient.updatedAt));
      return { clients: rows };
    }),

    create: lawyerProcedure
      .input(
        z.object({
          displayName: z.string().min(1).max(200),
          phone: z.string().max(32).optional().nullable(),
          email: z.string().email().max(200).optional().nullable(),
          platformUserId: z.string().min(1).max(128).optional().nullable(),
          notes: z.string().max(8000).optional().default(''),
          referralSource: z.string().max(200).optional().nullable(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const now = new Date();
        const [created] = await ctx.db
          .insert(lawyerClient)
          .values({
            lawyerUserId: ctx.authUserId,
            displayName: input.displayName,
            phone: input.phone ?? null,
            email: input.email ?? null,
            platformUserId: input.platformUserId ?? null,
            notes: input.notes ?? '',
            referralSource: input.referralSource ?? null,
            updatedAt: now,
          })
          .returning();
        return { client: created ?? null };
      }),

    update: lawyerProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          displayName: z.string().min(1).max(200).optional(),
          phone: z.string().max(32).nullable().optional(),
          email: z.string().email().max(200).nullable().optional(),
          platformUserId: z.string().min(1).max(128).nullable().optional(),
          notes: z.string().max(8000).optional(),
          referralSource: z.string().max(200).nullable().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await assertClientOwned(ctx.db, ctx.authUserId, input.id);
        const patch: Partial<typeof lawyerClient.$inferInsert> = { updatedAt: new Date() };
        if (input.displayName !== undefined) patch.displayName = input.displayName;
        if (input.phone !== undefined) patch.phone = input.phone;
        if (input.email !== undefined) patch.email = input.email;
        if (input.platformUserId !== undefined) patch.platformUserId = input.platformUserId;
        if (input.notes !== undefined) patch.notes = input.notes;
        if (input.referralSource !== undefined) patch.referralSource = input.referralSource;
        const [updated] = await ctx.db
          .update(lawyerClient)
          .set(patch)
          .where(eq(lawyerClient.id, input.id))
          .returning();
        return { client: updated ?? null };
      }),

    delete: lawyerProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
      await assertClientOwned(ctx.db, ctx.authUserId, input.id);
      const [ref] = await ctx.db
        .select({ id: lawyerCase.id })
        .from(lawyerCase)
        .where(eq(lawyerCase.lawyerClientId, input.id))
        .limit(1);
      if (ref) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot delete client linked to one or more cases. Unlink cases first.',
        });
      }
      await ctx.db.delete(lawyerClient).where(eq(lawyerClient.id, input.id));
      return { ok: true as const };
    }),
  }),

  case: router({
    list: lawyerProcedure
      .input(
        z
          .object({
            status: caseStatusSchema.optional(),
            search: z.string().max(120).optional(),
          })
          .optional(),
      )
      .query(async ({ ctx, input }) => {
        const lawyerUserId = ctx.authUserId;
        const search = input?.search?.trim();
        const status = input?.status;
        const conditions: SQL[] = [eq(lawyerCase.lawyerUserId, lawyerUserId)];
        if (status) {
          conditions.push(eq(lawyerCase.status, status));
        }
        if (search && search.length > 0) {
          const term = `%${escapeLikePattern(search)}%`;
          conditions.push(
            or(
              ilike(lawyerCase.courtName, term),
              ilike(lawyerCase.description, term),
              ilike(lawyerCase.caseType, term),
            )!,
          );
        }
        const rows = await ctx.db
          .select()
          .from(lawyerCase)
          .where(and(...conditions))
          .orderBy(desc(lawyerCase.updatedAt));
        return { cases: rows };
      }),

    byId: lawyerProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
      const row = await loadCaseForLawyer(ctx.db, ctx.authUserId, input.id);
      return { case: row };
    }),

    create: lawyerProcedure
      .input(
        z.object({
          lawyerClientId: z.string().uuid().nullable().optional(),
          clientDisplayName: z.string().max(200).nullable().optional(),
          courtCaseNumber: z.string().max(120).nullable().optional(),
          cnrNumber: z.string().max(32).nullable().optional(),
          courtName: z.string().max(300).optional().default(''),
          courtType: courtTypeSchema.optional().default('other'),
          state: z.string().max(64).optional().default(''),
          district: z.string().max(120).optional().default(''),
          caseType: z.string().max(120).optional().default(''),
          description: z.string().max(8000).optional().default(''),
          status: caseStatusSchema.optional().default('intake'),
          opposingParty: z.string().max(300).nullable().optional(),
          nextHearingAt: z.coerce.date().nullable().optional(),
          feeAgreedInr: z.number().int().nonnegative().nullable().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (input.lawyerClientId) {
          await assertClientOwned(ctx.db, ctx.authUserId, input.lawyerClientId);
        }
        const now = new Date();
        const [created] = await ctx.db
          .insert(lawyerCase)
          .values({
            lawyerUserId: ctx.authUserId,
            lawyerClientId: input.lawyerClientId ?? null,
            clientDisplayName: input.clientDisplayName ?? null,
            courtCaseNumber: input.courtCaseNumber ?? null,
            cnrNumber: input.cnrNumber ?? null,
            courtName: input.courtName,
            courtType: input.courtType,
            state: input.state,
            district: input.district,
            caseType: input.caseType,
            description: input.description,
            status: input.status,
            opposingParty: input.opposingParty ?? null,
            nextHearingAt: input.nextHearingAt ?? null,
            feeAgreedInr: input.feeAgreedInr ?? null,
            updatedAt: now,
          })
          .returning();
        return { case: created ?? null };
      }),

    update: lawyerProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          lawyerClientId: z.string().uuid().nullable().optional(),
          clientDisplayName: z.string().max(200).nullable().optional(),
          courtCaseNumber: z.string().max(120).nullable().optional(),
          cnrNumber: z.string().max(32).nullable().optional(),
          courtName: z.string().max(300).optional(),
          courtType: courtTypeSchema.optional(),
          state: z.string().max(64).optional(),
          district: z.string().max(120).optional(),
          caseType: z.string().max(120).optional(),
          description: z.string().max(8000).optional(),
          status: caseStatusSchema.optional(),
          opposingParty: z.string().max(300).nullable().optional(),
          nextHearingAt: z.coerce.date().nullable().optional(),
          feeAgreedInr: z.number().int().nonnegative().nullable().optional(),
          outcome: z.string().max(8000).nullable().optional(),
          caseOutcome: caseOutcomeSchema.optional(),
          closedAt: z.coerce.date().nullable().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await loadCaseForLawyer(ctx.db, ctx.authUserId, input.id);
        if (input.lawyerClientId) {
          await assertClientOwned(ctx.db, ctx.authUserId, input.lawyerClientId);
        }
        const patch: Partial<typeof lawyerCase.$inferInsert> = { updatedAt: new Date() };
        const fields = [
          'lawyerClientId',
          'clientDisplayName',
          'courtCaseNumber',
          'cnrNumber',
          'courtName',
          'courtType',
          'state',
          'district',
          'caseType',
          'description',
          'status',
          'opposingParty',
          'nextHearingAt',
          'feeAgreedInr',
          'outcome',
          'caseOutcome',
          'closedAt',
        ] as const;
        for (const k of fields) {
          if (input[k] !== undefined) {
            (patch as Record<string, unknown>)[k] = input[k];
          }
        }
        const [updated] = await ctx.db
          .update(lawyerCase)
          .set(patch)
          .where(eq(lawyerCase.id, input.id))
          .returning();
        return { case: updated ?? null };
      }),

    delete: lawyerProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
      await loadCaseForLawyer(ctx.db, ctx.authUserId, input.id);
      await ctx.db.delete(lawyerCase).where(eq(lawyerCase.id, input.id));
      return { ok: true as const };
    }),
  }),

  hearing: router({
    list: lawyerProcedure.input(z.object({ caseId: z.string().uuid() })).query(async ({ ctx, input }) => {
      await loadCaseForLawyer(ctx.db, ctx.authUserId, input.caseId);
      const rows = await ctx.db
        .select()
        .from(lawyerCaseHearing)
        .where(eq(lawyerCaseHearing.caseId, input.caseId))
        .orderBy(desc(lawyerCaseHearing.hearingAt));
      return { hearings: rows };
    }),

    create: lawyerProcedure
      .input(
        z.object({
          caseId: z.string().uuid(),
          hearingAt: z.coerce.date(),
          courtRoom: z.string().max(120).nullable().optional(),
          judgeName: z.string().max(200).nullable().optional(),
          whatHappened: z.string().max(8000).nullable().optional(),
          nextHearingAt: z.coerce.date().nullable().optional(),
          actionItems: z.array(z.string().max(400)).max(24).optional().default([]),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await loadCaseForLawyer(ctx.db, ctx.authUserId, input.caseId);
        const [created] = await ctx.db
          .insert(lawyerCaseHearing)
          .values({
            caseId: input.caseId,
            hearingAt: input.hearingAt,
            courtRoom: input.courtRoom ?? null,
            judgeName: input.judgeName ?? null,
            whatHappened: input.whatHappened ?? null,
            nextHearingAt: input.nextHearingAt ?? null,
            actionItems: input.actionItems ?? [],
          })
          .returning();
        if (created) {
          await upsertReminderJobsForHearing({
            db: ctx.db,
            userId: ctx.authUserId,
            hearingId: created.id,
            hearingAt: created.hearingAt,
            caseId: input.caseId,
          });
        }
        return { hearing: created ?? null };
      }),

    update: lawyerProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          caseId: z.string().uuid(),
          hearingAt: z.coerce.date().optional(),
          courtRoom: z.string().max(120).nullable().optional(),
          judgeName: z.string().max(200).nullable().optional(),
          whatHappened: z.string().max(8000).nullable().optional(),
          nextHearingAt: z.coerce.date().nullable().optional(),
          actionItems: z.array(z.string().max(400)).max(24).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await loadCaseForLawyer(ctx.db, ctx.authUserId, input.caseId);
        const [existing] = await ctx.db
          .select()
          .from(lawyerCaseHearing)
          .where(and(eq(lawyerCaseHearing.id, input.id), eq(lawyerCaseHearing.caseId, input.caseId)))
          .limit(1);
        if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Hearing not found.' });
        const patch: Partial<typeof lawyerCaseHearing.$inferInsert> = {};
        if (input.hearingAt !== undefined) patch.hearingAt = input.hearingAt;
        if (input.courtRoom !== undefined) patch.courtRoom = input.courtRoom;
        if (input.judgeName !== undefined) patch.judgeName = input.judgeName;
        if (input.whatHappened !== undefined) patch.whatHappened = input.whatHappened;
        if (input.nextHearingAt !== undefined) patch.nextHearingAt = input.nextHearingAt;
        if (input.actionItems !== undefined) patch.actionItems = input.actionItems;
        const [updated] = await ctx.db
          .update(lawyerCaseHearing)
          .set(patch)
          .where(eq(lawyerCaseHearing.id, input.id))
          .returning();
        if (updated?.hearingAt) {
          await upsertReminderJobsForHearing({
            db: ctx.db,
            userId: ctx.authUserId,
            hearingId: updated.id,
            hearingAt: updated.hearingAt,
            caseId: input.caseId,
          });
        }
        return { hearing: updated ?? null };
      }),

    delete: lawyerProcedure
      .input(z.object({ id: z.string().uuid(), caseId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        await loadCaseForLawyer(ctx.db, ctx.authUserId, input.caseId);
        const [existing] = await ctx.db
          .select()
          .from(lawyerCaseHearing)
          .where(and(eq(lawyerCaseHearing.id, input.id), eq(lawyerCaseHearing.caseId, input.caseId)))
          .limit(1);
        if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Hearing not found.' });
        await ctx.db.delete(lawyerCaseHearing).where(eq(lawyerCaseHearing.id, input.id));
        return { ok: true as const };
      }),
  }),

  task: router({
    list: lawyerProcedure.input(z.object({ caseId: z.string().uuid() })).query(async ({ ctx, input }) => {
      await loadCaseForLawyer(ctx.db, ctx.authUserId, input.caseId);
      const rows = await ctx.db
        .select()
        .from(lawyerCaseTask)
        .where(eq(lawyerCaseTask.caseId, input.caseId))
        .orderBy(lawyerCaseTask.dueAt, desc(lawyerCaseTask.createdAt));
      return { tasks: rows };
    }),

    create: lawyerProcedure
      .input(
        z.object({
          caseId: z.string().uuid(),
          title: z.string().min(1).max(400),
          dueAt: z.coerce.date().nullable().optional(),
          priority: taskPrioritySchema.optional().default('normal'),
          status: taskStatusSchema.optional().default('open'),
          assigneeUserId: z.string().min(1).max(128).nullable().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await loadCaseForLawyer(ctx.db, ctx.authUserId, input.caseId);
        const now = new Date();
        const [created] = await ctx.db
          .insert(lawyerCaseTask)
          .values({
            caseId: input.caseId,
            title: input.title,
            dueAt: input.dueAt ?? null,
            priority: input.priority,
            status: input.status,
            assigneeUserId: input.assigneeUserId ?? null,
            updatedAt: now,
          })
          .returning();
        return { task: created ?? null };
      }),

    update: lawyerProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          caseId: z.string().uuid(),
          title: z.string().min(1).max(400).optional(),
          dueAt: z.coerce.date().nullable().optional(),
          priority: taskPrioritySchema.optional(),
          status: taskStatusSchema.optional(),
          assigneeUserId: z.string().min(1).max(128).nullable().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await loadCaseForLawyer(ctx.db, ctx.authUserId, input.caseId);
        const [existing] = await ctx.db
          .select()
          .from(lawyerCaseTask)
          .where(and(eq(lawyerCaseTask.id, input.id), eq(lawyerCaseTask.caseId, input.caseId)))
          .limit(1);
        if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Task not found.' });
        const patch: Partial<typeof lawyerCaseTask.$inferInsert> = { updatedAt: new Date() };
        if (input.title !== undefined) patch.title = input.title;
        if (input.dueAt !== undefined) patch.dueAt = input.dueAt;
        if (input.priority !== undefined) patch.priority = input.priority;
        if (input.status !== undefined) patch.status = input.status;
        if (input.assigneeUserId !== undefined) patch.assigneeUserId = input.assigneeUserId;
        const [updated] = await ctx.db
          .update(lawyerCaseTask)
          .set(patch)
          .where(eq(lawyerCaseTask.id, input.id))
          .returning();
        return { task: updated ?? null };
      }),

    delete: lawyerProcedure
      .input(z.object({ id: z.string().uuid(), caseId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        await loadCaseForLawyer(ctx.db, ctx.authUserId, input.caseId);
        const [existing] = await ctx.db
          .select()
          .from(lawyerCaseTask)
          .where(and(eq(lawyerCaseTask.id, input.id), eq(lawyerCaseTask.caseId, input.caseId)))
          .limit(1);
        if (!existing) throw new TRPCError({ code: 'NOT_FOUND', message: 'Task not found.' });
        await ctx.db.delete(lawyerCaseTask).where(eq(lawyerCaseTask.id, input.id));
        return { ok: true as const };
      }),
  }),

  document: router({
    list: lawyerProcedure.input(z.object({ caseId: z.string().uuid() })).query(async ({ ctx, input }) => {
      await loadCaseForLawyer(ctx.db, ctx.authUserId, input.caseId);
      const rows = await ctx.db
        .select()
        .from(lawyerCaseDocument)
        .where(eq(lawyerCaseDocument.caseId, input.caseId))
        .orderBy(desc(lawyerCaseDocument.createdAt));
      return { documents: rows };
    }),

    requestUpload: lawyerProcedure
      .input(
        z.object({
          caseId: z.string().uuid(),
          fileName: z.string().min(1).max(200),
          contentType: z.string().min(1).max(120),
          byteSize: z.number().int().positive(),
          visibleToClient: z.boolean().optional().default(false),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (!ctx.s3Documents) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: new StorageNotConfiguredError().message,
          });
        }
        const c = await loadCaseForLawyer(ctx.db, ctx.authUserId, input.caseId);
        const documentId = randomUUID();
        const storageKey = caseDocumentObjectKey(c.lawyerUserId, c.id, documentId, input.fileName);
        const now = new Date();
        await ctx.db.insert(lawyerCaseDocument).values({
          id: documentId,
          caseId: input.caseId,
          uploadedByUserId: ctx.authUserId,
          storageKey,
          fileName: input.fileName,
          contentType: input.contentType,
          byteSize: input.byteSize,
          visibleToClient: input.visibleToClient,
          uploadStatus: 'pending',
          updatedAt: now,
        });
        const { url } = await presignPutObject(ctx.s3Documents, {
          key: storageKey,
          contentType: input.contentType,
          contentLength: input.byteSize,
        });
        return { documentId, uploadUrl: url, storageKey };
      }),

    confirmUpload: lawyerProcedure
      .input(
        z.object({
          documentId: z.string().uuid(),
          caseId: z.string().uuid(),
          byteSize: z.number().int().positive(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await loadCaseForLawyer(ctx.db, ctx.authUserId, input.caseId);
        const [row] = await ctx.db
          .select()
          .from(lawyerCaseDocument)
          .where(
            and(
              eq(lawyerCaseDocument.id, input.documentId),
              eq(lawyerCaseDocument.caseId, input.caseId),
            ),
          )
          .limit(1);
        if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found.' });
        if (row.uploadStatus !== 'pending') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Upload already confirmed.' });
        }
        if (row.byteSize !== input.byteSize) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Byte size does not match upload request.' });
        }
        const now = new Date();
        await ctx.db
          .update(lawyerCaseDocument)
          .set({
            uploadStatus: 'complete',
            uploadedAt: now,
            updatedAt: now,
          })
          .where(eq(lawyerCaseDocument.id, input.documentId));
        return { ok: true as const };
      }),

    presignDownload: lawyerProcedure
      .input(z.object({ documentId: z.string().uuid(), caseId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.s3Documents) {
          throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: new StorageNotConfiguredError().message,
          });
        }
        await loadCaseForLawyer(ctx.db, ctx.authUserId, input.caseId);
        const [row] = await ctx.db
          .select()
          .from(lawyerCaseDocument)
          .where(
            and(
              eq(lawyerCaseDocument.id, input.documentId),
              eq(lawyerCaseDocument.caseId, input.caseId),
            ),
          )
          .limit(1);
        if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found.' });
        if (row.uploadStatus !== 'complete') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Upload not complete.' });
        }
        const { url } = await presignGetCaseDocumentObject(ctx.s3Documents, { key: row.storageKey });
        return { downloadUrl: url };
      }),

    delete: lawyerProcedure
      .input(z.object({ documentId: z.string().uuid(), caseId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        await loadCaseForLawyer(ctx.db, ctx.authUserId, input.caseId);
        const [row] = await ctx.db
          .select()
          .from(lawyerCaseDocument)
          .where(
            and(
              eq(lawyerCaseDocument.id, input.documentId),
              eq(lawyerCaseDocument.caseId, input.caseId),
            ),
          )
          .limit(1);
        if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found.' });
        if (ctx.s3Documents) {
          try {
            await deleteCaseDocumentObject(ctx.s3Documents, row.storageKey);
          } catch {
            // best-effort
          }
        }
        await ctx.db.delete(lawyerCaseDocument).where(eq(lawyerCaseDocument.id, input.documentId));
        return { ok: true as const };
      }),
  }),

  calendar: router({
    upcoming: lawyerProcedure
      .input(
        z.object({
          from: z.coerce.date(),
          to: z.coerce.date(),
        }),
      )
      .query(async ({ ctx, input }) => {
        const lawyerUserId = ctx.authUserId;
        const { from, to } = input;
        const hearingRows = await ctx.db
          .select({
            hearing: lawyerCaseHearing,
            case: lawyerCase,
          })
          .from(lawyerCaseHearing)
          .innerJoin(lawyerCase, eq(lawyerCaseHearing.caseId, lawyerCase.id))
          .where(
            and(
              eq(lawyerCase.lawyerUserId, lawyerUserId),
              gte(lawyerCaseHearing.hearingAt, from),
              lte(lawyerCaseHearing.hearingAt, to),
            ),
          )
          .orderBy(lawyerCaseHearing.hearingAt);

        const taskRows = await ctx.db
          .select({
            task: lawyerCaseTask,
            case: lawyerCase,
          })
          .from(lawyerCaseTask)
          .innerJoin(lawyerCase, eq(lawyerCaseTask.caseId, lawyerCase.id))
          .where(
            and(
              eq(lawyerCase.lawyerUserId, lawyerUserId),
              eq(lawyerCaseTask.status, 'open'),
              isNotNull(lawyerCaseTask.dueAt),
              gte(lawyerCaseTask.dueAt, from),
              lte(lawyerCaseTask.dueAt, to),
            ),
          )
          .orderBy(lawyerCaseTask.dueAt);

        return {
          hearings: hearingRows.map((r) => ({
            ...r.hearing,
            case: { id: r.case.id, courtName: r.case.courtName, caseType: r.case.caseType },
          })),
          tasks: taskRows.map((r) => ({
            ...r.task,
            case: { id: r.case.id, courtName: r.case.courtName, caseType: r.case.caseType },
          })),
        };
      }),
  }),

  court: router({
    lookupByCnr: lawyerProcedure.input(z.object({ cnr: z.string().min(1).max(40) })).query(async ({ ctx, input }) => {
      if (!ctx.njdgBridgeUrl || !ctx.njdgBridgeSecret) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Court status bridge is not configured (set NJDG_BRIDGE_URL and NJDG_BRIDGE_SECRET).',
        });
      }
      try {
        const cnr = normalizeAndValidateCnr(input.cnr);
        const snapshot = await fetchCourtSnapshotViaBridge(
          ctx.njdgBridgeUrl,
          ctx.njdgBridgeSecret,
          cnr,
        );
        return { cnr, snapshot };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Lookup failed.';
        throw new TRPCError({ code: 'BAD_REQUEST', message: msg });
      }
    }),
  }),
});
