import { randomUUID } from 'node:crypto';

import { TRPCError } from '@trpc/server';
import { and, asc, desc, eq, isNotNull, isNull, sum } from 'drizzle-orm';
import { z } from 'zod';

import {
  lawyerCase,
  lawyerCaseTask,
  lawyerFirmProfile,
  lawyerInvoice,
  lawyerInvoiceCounter,
  lawyerInvoiceLine,
  lawyerInvoicePayment,
  lawyerTimeEntry,
} from '@kb/database/schema';

import {
  computeRazorpayClientSignature,
  createRazorpayOrder,
  requireConfiguredRazorpay,
} from '../integrations/razorpay';
import { lawyerProcedure, router } from '../init';
import { indianFyStartYear } from '../practice/fiscal-india';
import { aggregateInvoiceTax } from '../practice/gst-totals';
import { renderInvoicePdfBase64 } from '../practice/invoice-pdf';

import type { TrpcContext } from '../context';

type Db = TrpcContext['db'];

async function loadCaseForLawyer(db: Db, lawyerUserId: string, caseId: string) {
  const [row] = await db
    .select()
    .from(lawyerCase)
    .where(and(eq(lawyerCase.id, caseId), eq(lawyerCase.lawyerUserId, lawyerUserId)))
    .limit(1);
  if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Case not found.' });
  return row;
}

async function loadInvoiceForLawyer(db: Db, lawyerUserId: string, invoiceId: string) {
  const [row] = await db
    .select()
    .from(lawyerInvoice)
    .where(and(eq(lawyerInvoice.id, invoiceId), eq(lawyerInvoice.lawyerUserId, lawyerUserId)))
    .limit(1);
  if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Invoice not found.' });
  return row;
}

async function recalculateInvoiceTotals(db: Db, invoiceId: string) {
  const lines = await db
    .select()
    .from(lawyerInvoiceLine)
    .where(eq(lawyerInvoiceLine.invoiceId, invoiceId))
    .orderBy(asc(lawyerInvoiceLine.sortOrder), asc(lawyerInvoiceLine.createdAt));

  const [inv] = await db.select().from(lawyerInvoice).where(eq(lawyerInvoice.id, invoiceId)).limit(1);
  if (!inv) return;

  const taxLines = lines.map((l) => ({ taxableInr: l.taxableInr, taxRatePercent: l.taxRatePercent }));
  const totals = aggregateInvoiceTax(taxLines, inv.supplyType);

  await db
    .update(lawyerInvoice)
    .set({
      taxableInr: totals.taxableInr,
      cgstInr: totals.cgstInr,
      sgstInr: totals.sgstInr,
      igstInr: totals.igstInr,
      totalInr: totals.totalInr,
      updatedAt: new Date(),
    })
    .where(eq(lawyerInvoice.id, invoiceId));
}

async function allocateInvoiceNumber(
  tx: Db,
  lawyerUserId: string,
  issueDate: Date,
): Promise<{ invoiceNumber: string; fyStartYear: number }> {
  const [firm] = await tx.select().from(lawyerFirmProfile).where(eq(lawyerFirmProfile.userId, lawyerUserId)).limit(1);
  const prefix = (firm?.invoicePrefix ?? 'INV').trim() || 'INV';
  const fy = indianFyStartYear(issueDate);

  const [existing] = await tx
    .select()
    .from(lawyerInvoiceCounter)
    .where(and(eq(lawyerInvoiceCounter.lawyerUserId, lawyerUserId), eq(lawyerInvoiceCounter.fyStartYear, fy)))
    .for('update')
    .limit(1);

  const nextSeq = (existing?.lastSequence ?? 0) + 1;
  if (!existing) {
    await tx.insert(lawyerInvoiceCounter).values({
      lawyerUserId,
      fyStartYear: fy,
      lastSequence: nextSeq,
      updatedAt: new Date(),
    });
  } else {
    await tx
      .update(lawyerInvoiceCounter)
      .set({ lastSequence: nextSeq, updatedAt: new Date() })
      .where(and(eq(lawyerInvoiceCounter.lawyerUserId, lawyerUserId), eq(lawyerInvoiceCounter.fyStartYear, fy)));
  }

  const invoiceNumber = `${prefix}-${fy}-${String(nextSeq).padStart(4, '0')}`;
  return { invoiceNumber, fyStartYear: fy };
}

const lineKindSchema = z.enum(['consultation', 'hearing', 'drafting', 'time', 'misc']);
const supplyTypeSchema = z.enum(['intrastate', 'interstate']);

export const practiceBillingRouter = router({
  firm: router({
    get: lawyerProcedure.query(async ({ ctx }) => {
      const [row] = await ctx.db
        .select()
        .from(lawyerFirmProfile)
        .where(eq(lawyerFirmProfile.userId, ctx.authUserId))
        .limit(1);
      return { profile: row ?? null };
    }),

    upsert: lawyerProcedure
      .input(
        z.object({
          legalName: z.string().max(300).optional(),
          addressLine1: z.string().max(300).optional(),
          addressLine2: z.string().max(300).optional(),
          city: z.string().max(120).optional(),
          stateCode: z.string().max(8).optional(),
          pincode: z.string().max(16).optional(),
          gstin: z.string().max(20).nullable().optional(),
          pan: z.string().max(12).nullable().optional(),
          defaultHsnSac: z.string().max(32).optional(),
          invoicePrefix: z.string().max(32).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const now = new Date();
        const [existing] = await ctx.db
          .select()
          .from(lawyerFirmProfile)
          .where(eq(lawyerFirmProfile.userId, ctx.authUserId))
          .limit(1);
        if (existing) {
          const patch: Partial<typeof lawyerFirmProfile.$inferInsert> = { updatedAt: now };
          if (input.legalName !== undefined) patch.legalName = input.legalName;
          if (input.addressLine1 !== undefined) patch.addressLine1 = input.addressLine1;
          if (input.addressLine2 !== undefined) patch.addressLine2 = input.addressLine2;
          if (input.city !== undefined) patch.city = input.city;
          if (input.stateCode !== undefined) patch.stateCode = input.stateCode;
          if (input.pincode !== undefined) patch.pincode = input.pincode;
          if (input.gstin !== undefined) patch.gstin = input.gstin;
          if (input.pan !== undefined) patch.pan = input.pan;
          if (input.defaultHsnSac !== undefined) patch.defaultHsnSac = input.defaultHsnSac;
          if (input.invoicePrefix !== undefined) patch.invoicePrefix = input.invoicePrefix;
          const [updated] = await ctx.db
            .update(lawyerFirmProfile)
            .set(patch)
            .where(eq(lawyerFirmProfile.userId, ctx.authUserId))
            .returning();
          return { profile: updated ?? null };
        }
        const [created] = await ctx.db
          .insert(lawyerFirmProfile)
          .values({
            userId: ctx.authUserId,
            legalName: input.legalName ?? '',
            addressLine1: input.addressLine1 ?? '',
            addressLine2: input.addressLine2 ?? '',
            city: input.city ?? '',
            stateCode: input.stateCode ?? '',
            pincode: input.pincode ?? '',
            gstin: input.gstin ?? null,
            pan: input.pan ?? null,
            defaultHsnSac: input.defaultHsnSac ?? '998212',
            invoicePrefix: input.invoicePrefix ?? 'INV',
            updatedAt: now,
          })
          .returning();
        return { profile: created ?? null };
      }),
  }),

  timeEntry: router({
    list: lawyerProcedure.input(z.object({ caseId: z.string().uuid() })).query(async ({ ctx, input }) => {
      await loadCaseForLawyer(ctx.db, ctx.authUserId, input.caseId);
      return ctx.db
        .select()
        .from(lawyerTimeEntry)
        .where(and(eq(lawyerTimeEntry.caseId, input.caseId), eq(lawyerTimeEntry.lawyerUserId, ctx.authUserId)))
        .orderBy(desc(lawyerTimeEntry.startedAt));
    }),

    active: lawyerProcedure.query(async ({ ctx }) => {
      const [row] = await ctx.db
        .select()
        .from(lawyerTimeEntry)
        .where(and(eq(lawyerTimeEntry.lawyerUserId, ctx.authUserId), isNull(lawyerTimeEntry.endedAt)))
        .limit(1);
      return { entry: row ?? null };
    }),

    start: lawyerProcedure
      .input(
        z.object({
          caseId: z.string().uuid(),
          taskId: z.string().uuid().optional(),
          notes: z.string().max(2000).optional().default(''),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        await loadCaseForLawyer(ctx.db, ctx.authUserId, input.caseId);
        if (input.taskId) {
          const [t] = await ctx.db
            .select()
            .from(lawyerCaseTask)
            .where(and(eq(lawyerCaseTask.id, input.taskId), eq(lawyerCaseTask.caseId, input.caseId)))
            .limit(1);
          if (!t) throw new TRPCError({ code: 'NOT_FOUND', message: 'Task not found for case.' });
        }
        const [open] = await ctx.db
          .select({ id: lawyerTimeEntry.id })
          .from(lawyerTimeEntry)
          .where(and(eq(lawyerTimeEntry.lawyerUserId, ctx.authUserId), isNull(lawyerTimeEntry.endedAt)))
          .limit(1);
        if (open) {
          throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Stop the running timer before starting another.' });
        }
        const now = new Date();
        const [created] = await ctx.db
          .insert(lawyerTimeEntry)
          .values({
            lawyerUserId: ctx.authUserId,
            caseId: input.caseId,
            taskId: input.taskId ?? null,
            startedAt: now,
            notes: input.notes ?? '',
            updatedAt: now,
          })
          .returning();
        return { entry: created ?? null };
      }),

    stop: lawyerProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select()
        .from(lawyerTimeEntry)
        .where(and(eq(lawyerTimeEntry.id, input.id), eq(lawyerTimeEntry.lawyerUserId, ctx.authUserId)))
        .limit(1);
      if (!row) throw new TRPCError({ code: 'NOT_FOUND', message: 'Time entry not found.' });
      if (row.endedAt) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Timer already stopped.' });
      }
      const ended = new Date();
      const durationSeconds = Math.max(0, Math.floor((ended.getTime() - row.startedAt.getTime()) / 1000));
      const [updated] = await ctx.db
        .update(lawyerTimeEntry)
        .set({ endedAt: ended, durationSeconds, updatedAt: ended })
        .where(eq(lawyerTimeEntry.id, row.id))
        .returning();
      return { entry: updated ?? null };
    }),
  }),

  invoice: router({
    list: lawyerProcedure
      .input(z.object({ limit: z.number().int().min(1).max(100).optional().default(50) }).optional())
      .query(async ({ ctx, input }) => {
        const limit = input?.limit ?? 50;
        return ctx.db
          .select()
          .from(lawyerInvoice)
          .where(eq(lawyerInvoice.lawyerUserId, ctx.authUserId))
          .orderBy(desc(lawyerInvoice.updatedAt))
          .limit(limit);
      }),

    byId: lawyerProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
      const inv = await loadInvoiceForLawyer(ctx.db, ctx.authUserId, input.id);
      const lines = await ctx.db
        .select()
        .from(lawyerInvoiceLine)
        .where(eq(lawyerInvoiceLine.invoiceId, inv.id))
        .orderBy(asc(lawyerInvoiceLine.sortOrder), asc(lawyerInvoiceLine.createdAt));
      const payments = await ctx.db
        .select()
        .from(lawyerInvoicePayment)
        .where(eq(lawyerInvoicePayment.invoiceId, inv.id))
        .orderBy(desc(lawyerInvoicePayment.createdAt));
      return { invoice: inv, lines, payments };
    }),

    createDraft: lawyerProcedure
      .input(
        z.object({
          caseId: z.string().uuid().optional(),
          consultationId: z.string().uuid().optional(),
          supplyType: supplyTypeSchema.optional().default('intrastate'),
          clientName: z.string().max(300).optional().default(''),
          clientEmail: z.string().email().max(200).optional().nullable(),
          clientGstin: z.string().max(20).optional().nullable(),
          clientAddress: z.string().max(2000).optional().default(''),
          placeOfSupply: z.string().max(120).optional().default(''),
          issueDate: z.coerce.date(),
          dueDate: z.coerce.date().optional().nullable(),
          notes: z.string().max(4000).optional().default(''),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        if (input.caseId) await loadCaseForLawyer(ctx.db, ctx.authUserId, input.caseId);
        const draftNum = `DRAFT-${randomUUID()}`;
        const now = new Date();
        const [inv] = await ctx.db
          .insert(lawyerInvoice)
          .values({
            lawyerUserId: ctx.authUserId,
            caseId: input.caseId ?? null,
            consultationId: input.consultationId ?? null,
            invoiceNumber: draftNum,
            status: 'draft',
            supplyType: input.supplyType,
            clientName: input.clientName ?? '',
            clientEmail: input.clientEmail ?? null,
            clientGstin: input.clientGstin ?? null,
            clientAddress: input.clientAddress ?? '',
            placeOfSupply: input.placeOfSupply ?? '',
            issueDate: input.issueDate,
            dueDate: input.dueDate ?? null,
            notes: input.notes ?? '',
            updatedAt: now,
          })
          .returning();
        return { invoice: inv ?? null };
      }),

    addLine: lawyerProcedure
      .input(
        z.object({
          invoiceId: z.string().uuid(),
          kind: lineKindSchema.optional().default('misc'),
          description: z.string().min(1).max(2000),
          quantity: z.number().positive().max(1e6).optional().default(1),
          unitRateInr: z.number().int().nonnegative(),
          taxRatePercent: z.number().int().min(0).max(100).optional().default(18),
          hsnSac: z.string().max(32).optional().nullable(),
          sortOrder: z.number().int().optional().default(0),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const inv = await loadInvoiceForLawyer(ctx.db, ctx.authUserId, input.invoiceId);
        if (inv.status !== 'draft') {
          throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Only draft invoices can be edited.' });
        }
        const taxableInr = Math.round(input.quantity * input.unitRateInr);
        const [firm] = await ctx.db
          .select()
          .from(lawyerFirmProfile)
          .where(eq(lawyerFirmProfile.userId, ctx.authUserId))
          .limit(1);
        const hsn = input.hsnSac ?? firm?.defaultHsnSac ?? null;
        const [line] = await ctx.db
          .insert(lawyerInvoiceLine)
          .values({
            invoiceId: inv.id,
            kind: input.kind,
            description: input.description,
            quantity: input.quantity,
            unitRateInr: input.unitRateInr,
            taxRatePercent: input.taxRatePercent,
            taxableInr,
            hsnSac: hsn,
            sortOrder: input.sortOrder ?? 0,
          })
          .returning();
        await recalculateInvoiceTotals(ctx.db, inv.id);
        return { line: line ?? null };
      }),

    updateLine: lawyerProcedure
      .input(
        z.object({
          invoiceId: z.string().uuid(),
          lineId: z.string().uuid(),
          description: z.string().min(1).max(2000).optional(),
          quantity: z.number().positive().max(1e6).optional(),
          unitRateInr: z.number().int().nonnegative().optional(),
          taxRatePercent: z.number().int().min(0).max(100).optional(),
          kind: lineKindSchema.optional(),
          hsnSac: z.string().max(32).nullable().optional(),
          sortOrder: z.number().int().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const inv = await loadInvoiceForLawyer(ctx.db, ctx.authUserId, input.invoiceId);
        if (inv.status !== 'draft') {
          throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Only draft invoices can be edited.' });
        }
        const [line] = await ctx.db
          .select()
          .from(lawyerInvoiceLine)
          .where(and(eq(lawyerInvoiceLine.id, input.lineId), eq(lawyerInvoiceLine.invoiceId, inv.id)))
          .limit(1);
        if (!line) throw new TRPCError({ code: 'NOT_FOUND', message: 'Line not found.' });
        const qty = input.quantity ?? line.quantity;
        const rate = input.unitRateInr ?? line.unitRateInr;
        const taxableInr = Math.round(qty * rate);
        const patch: Partial<typeof lawyerInvoiceLine.$inferInsert> = {
          taxableInr,
        };
        if (input.description !== undefined) patch.description = input.description;
        if (input.quantity !== undefined) patch.quantity = input.quantity;
        if (input.unitRateInr !== undefined) patch.unitRateInr = input.unitRateInr;
        if (input.taxRatePercent !== undefined) patch.taxRatePercent = input.taxRatePercent;
        if (input.kind !== undefined) patch.kind = input.kind;
        if (input.hsnSac !== undefined) patch.hsnSac = input.hsnSac;
        if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;
        const [updated] = await ctx.db
          .update(lawyerInvoiceLine)
          .set(patch)
          .where(eq(lawyerInvoiceLine.id, line.id))
          .returning();
        await recalculateInvoiceTotals(ctx.db, inv.id);
        return { line: updated ?? null };
      }),

    deleteLine: lawyerProcedure
      .input(z.object({ invoiceId: z.string().uuid(), lineId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const inv = await loadInvoiceForLawyer(ctx.db, ctx.authUserId, input.invoiceId);
        if (inv.status !== 'draft') {
          throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Only draft invoices can be edited.' });
        }
        await ctx.db
          .delete(lawyerInvoiceLine)
          .where(and(eq(lawyerInvoiceLine.id, input.lineId), eq(lawyerInvoiceLine.invoiceId, inv.id)));
        await recalculateInvoiceTotals(ctx.db, inv.id);
        return { ok: true as const };
      }),

    attachUnbilledTime: lawyerProcedure
      .input(z.object({ invoiceId: z.string().uuid(), caseId: z.string().uuid() }))
      .mutation(async ({ ctx, input }) => {
        const inv = await loadInvoiceForLawyer(ctx.db, ctx.authUserId, input.invoiceId);
        if (inv.status !== 'draft') {
          throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Only draft invoices accept time lines.' });
        }
        if (inv.caseId && inv.caseId !== input.caseId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invoice case mismatch.' });
        }
        await loadCaseForLawyer(ctx.db, ctx.authUserId, input.caseId);
        if (!inv.caseId) {
          await ctx.db
            .update(lawyerInvoice)
            .set({ caseId: input.caseId, updatedAt: new Date() })
            .where(eq(lawyerInvoice.id, inv.id));
        }
        const entries = await ctx.db
          .select()
          .from(lawyerTimeEntry)
          .where(
            and(
              eq(lawyerTimeEntry.caseId, input.caseId),
              eq(lawyerTimeEntry.lawyerUserId, ctx.authUserId),
              isNull(lawyerTimeEntry.billedInvoiceId),
              isNotNull(lawyerTimeEntry.endedAt),
            ),
          );
        if (entries.length === 0) return { linesAdded: 0 };
        const [firm] = await ctx.db
          .select()
          .from(lawyerFirmProfile)
          .where(eq(lawyerFirmProfile.userId, ctx.authUserId))
          .limit(1);
        const hsn = firm?.defaultHsnSac ?? '998212';
        let order = 100;
        let added = 0;
        for (const e of entries) {
          const hours = (e.durationSeconds ?? 0) / 3600;
          if (hours <= 0) continue;
          const defaultRate = 2000;
          const taxableInr = Math.round(hours * defaultRate);
          await ctx.db.insert(lawyerInvoiceLine).values({
            invoiceId: inv.id,
            kind: 'time',
            description: `Professional time (${hours.toFixed(2)} h)${e.notes ? ` — ${e.notes.slice(0, 120)}` : ''}`,
            quantity: hours,
            unitRateInr: defaultRate,
            taxRatePercent: 18,
            taxableInr,
            hsnSac: hsn,
            sortOrder: order++,
          });
          await ctx.db
            .update(lawyerTimeEntry)
            .set({ billedInvoiceId: inv.id, updatedAt: new Date() })
            .where(eq(lawyerTimeEntry.id, e.id));
          added += 1;
        }
        await recalculateInvoiceTotals(ctx.db, inv.id);
        return { linesAdded: added };
      }),

    updateDraftMeta: lawyerProcedure
      .input(
        z.object({
          id: z.string().uuid(),
          supplyType: supplyTypeSchema.optional(),
          clientName: z.string().max(300).optional(),
          clientEmail: z.string().email().max(200).nullable().optional(),
          clientGstin: z.string().max(20).nullable().optional(),
          clientAddress: z.string().max(2000).optional(),
          placeOfSupply: z.string().max(120).optional(),
          issueDate: z.coerce.date().optional(),
          dueDate: z.coerce.date().nullable().optional(),
          notes: z.string().max(4000).optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const inv = await loadInvoiceForLawyer(ctx.db, ctx.authUserId, input.id);
        if (inv.status !== 'draft') {
          throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Only draft invoices can be updated.' });
        }
        const patch: Partial<typeof lawyerInvoice.$inferInsert> = { updatedAt: new Date() };
        if (input.supplyType !== undefined) patch.supplyType = input.supplyType;
        if (input.clientName !== undefined) patch.clientName = input.clientName;
        if (input.clientEmail !== undefined) patch.clientEmail = input.clientEmail;
        if (input.clientGstin !== undefined) patch.clientGstin = input.clientGstin;
        if (input.clientAddress !== undefined) patch.clientAddress = input.clientAddress;
        if (input.placeOfSupply !== undefined) patch.placeOfSupply = input.placeOfSupply;
        if (input.issueDate !== undefined) patch.issueDate = input.issueDate;
        if (input.dueDate !== undefined) patch.dueDate = input.dueDate;
        if (input.notes !== undefined) patch.notes = input.notes;
        const [updated] = await ctx.db.update(lawyerInvoice).set(patch).where(eq(lawyerInvoice.id, inv.id)).returning();
        if (input.supplyType !== undefined) {
          await recalculateInvoiceTotals(ctx.db, inv.id);
        }
        return { invoice: updated ?? null };
      }),

    finalize: lawyerProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        const inv = await loadInvoiceForLawyer(tx, ctx.authUserId, input.id);
        if (inv.status !== 'draft') {
          throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Invoice is not a draft.' });
        }
        const lines = await tx
          .select()
          .from(lawyerInvoiceLine)
          .where(eq(lawyerInvoiceLine.invoiceId, inv.id))
          .limit(1);
        if (lines.length === 0) {
          throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Add at least one line before finalizing.' });
        }
        await recalculateInvoiceTotals(tx, inv.id);
        const { invoiceNumber } = await allocateInvoiceNumber(tx, ctx.authUserId, inv.issueDate);
        const [updated] = await tx
          .update(lawyerInvoice)
          .set({
            invoiceNumber,
            status: 'sent',
            updatedAt: new Date(),
          })
          .where(eq(lawyerInvoice.id, inv.id))
          .returning();
        return { invoice: updated ?? null };
      });
    }),

    void: lawyerProcedure.input(z.object({ id: z.string().uuid() })).mutation(async ({ ctx, input }) => {
      const inv = await loadInvoiceForLawyer(ctx.db, ctx.authUserId, input.id);
      if (inv.status === 'paid' || inv.status === 'partially_paid') {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Cannot void an invoice with payments.' });
      }
      const paid = await ctx.db
        .select({ id: lawyerInvoicePayment.id })
        .from(lawyerInvoicePayment)
        .where(and(eq(lawyerInvoicePayment.invoiceId, inv.id), eq(lawyerInvoicePayment.status, 'paid')))
        .limit(1);
      if (paid.length) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Cannot void a paid invoice.' });
      }
      await ctx.db
        .update(lawyerTimeEntry)
        .set({ billedInvoiceId: null, updatedAt: new Date() })
        .where(eq(lawyerTimeEntry.billedInvoiceId, inv.id));
      const [updated] = await ctx.db
        .update(lawyerInvoice)
        .set({ status: 'void', updatedAt: new Date() })
        .where(eq(lawyerInvoice.id, inv.id))
        .returning();
      return { invoice: updated ?? null };
    }),

    pdfBase64: lawyerProcedure.input(z.object({ id: z.string().uuid() })).query(async ({ ctx, input }) => {
      const inv = await loadInvoiceForLawyer(ctx.db, ctx.authUserId, input.id);
      const [firm] = await ctx.db
        .select()
        .from(lawyerFirmProfile)
        .where(eq(lawyerFirmProfile.userId, ctx.authUserId))
        .limit(1);
      const lines = await ctx.db
        .select()
        .from(lawyerInvoiceLine)
        .where(eq(lawyerInvoiceLine.invoiceId, inv.id))
        .orderBy(asc(lawyerInvoiceLine.sortOrder));
      const lawyerAddress = [firm?.addressLine1, firm?.addressLine2, `${firm?.city ?? ''} ${firm?.pincode ?? ''}`]
        .filter(Boolean)
        .join('\n');
      const pdf = await renderInvoicePdfBase64({
        invoiceNumber: inv.invoiceNumber,
        issueDateIso: inv.issueDate.toISOString().slice(0, 10),
        dueDateIso: inv.dueDate ? inv.dueDate.toISOString().slice(0, 10) : null,
        supplyType: inv.supplyType,
        lawyerLegalName: firm?.legalName ?? '',
        lawyerAddress: lawyerAddress || '—',
        lawyerGstin: firm?.gstin ?? null,
        clientName: inv.clientName,
        clientAddress: inv.clientAddress,
        clientGstin: inv.clientGstin,
        placeOfSupply: inv.placeOfSupply,
        lines: lines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitRateInr: l.unitRateInr,
          taxableInr: l.taxableInr,
          taxRatePercent: l.taxRatePercent,
        })),
        taxableInr: inv.taxableInr,
        cgstInr: inv.cgstInr,
        sgstInr: inv.sgstInr,
        igstInr: inv.igstInr,
        totalInr: inv.totalInr,
        notes: inv.notes,
      });
      return { fileName: `${inv.invoiceNumber}.pdf`, base64: pdf };
    }),

    createPaymentOrder: lawyerProcedure
      .input(z.object({ invoiceId: z.string().uuid(), amountInr: z.number().int().positive().optional() }))
      .mutation(async ({ ctx, input }) => {
        const { id: keyId, secret: keySecret } = requireConfiguredRazorpay(ctx);
        const inv = await loadInvoiceForLawyer(ctx.db, ctx.authUserId, input.invoiceId);
        if (inv.status === 'void' || inv.status === 'draft') {
          throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Invoice must be sent before collecting payment.' });
        }
        if (inv.status === 'paid') {
          throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Invoice already paid.' });
        }
        const [paidRow] = await ctx.db
          .select({ s: sum(lawyerInvoicePayment.amountInr) })
          .from(lawyerInvoicePayment)
          .where(and(eq(lawyerInvoicePayment.invoiceId, inv.id), eq(lawyerInvoicePayment.status, 'paid')));
        const paidSum = Number(paidRow?.s ?? 0);
        const remaining = inv.totalInr - paidSum;
        const payAmount = input.amountInr ?? remaining;
        if (payAmount <= 0 || payAmount > remaining) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid payment amount.' });
        }
        const order = await createRazorpayOrder({
          keyId,
          keySecret,
          amountPaise: payAmount * 100,
          currency: inv.currency,
          receipt: `invoice:${inv.id}`.slice(0, 40),
        });
        const now = new Date();
        await ctx.db.insert(lawyerInvoicePayment).values({
          invoiceId: inv.id,
          amountInr: payAmount,
          currency: inv.currency,
          status: 'created',
          razorpayOrderId: order.id,
          updatedAt: now,
        });
        return { keyId, orderId: order.id, amountPaise: order.amount, currency: order.currency };
      }),

    verifyPayment: lawyerProcedure
      .input(
        z.object({
          invoiceId: z.string().uuid(),
          razorpayOrderId: z.string().min(1),
          razorpayPaymentId: z.string().min(1),
          razorpaySignature: z.string().min(1),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { secret } = requireConfiguredRazorpay(ctx);
        const expected = computeRazorpayClientSignature({
          secret,
          orderId: input.razorpayOrderId,
          paymentId: input.razorpayPaymentId,
        });
        if (expected !== input.razorpaySignature) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid payment signature.' });
        }
        await ctx.db.transaction(async (tx) => {
          const inv = await loadInvoiceForLawyer(tx, ctx.authUserId, input.invoiceId);
          const [pay] = await tx
            .select()
            .from(lawyerInvoicePayment)
            .where(and(eq(lawyerInvoicePayment.invoiceId, inv.id), eq(lawyerInvoicePayment.razorpayOrderId, input.razorpayOrderId)))
            .limit(1);
          if (!pay) throw new TRPCError({ code: 'NOT_FOUND', message: 'Payment record not found.' });
          if (pay.status === 'paid') return;
          const paidAt = new Date();
          await tx
            .update(lawyerInvoicePayment)
            .set({
              status: 'paid',
              razorpayPaymentId: input.razorpayPaymentId,
              razorpaySignature: input.razorpaySignature,
              paidAt,
              updatedAt: paidAt,
            })
            .where(eq(lawyerInvoicePayment.id, pay.id));

          const [agg] = await tx
            .select({ s: sum(lawyerInvoicePayment.amountInr) })
            .from(lawyerInvoicePayment)
            .where(and(eq(lawyerInvoicePayment.invoiceId, inv.id), eq(lawyerInvoicePayment.status, 'paid')));
          const paidSum = Number(agg?.s ?? 0);
          let status: typeof inv.status = inv.status;
          if (paidSum >= inv.totalInr) status = 'paid';
          else if (paidSum > 0) status = 'partially_paid';
          await tx.update(lawyerInvoice).set({ status, updatedAt: new Date() }).where(eq(lawyerInvoice.id, inv.id));
        });
        return { ok: true as const };
      }),
  }),
});
