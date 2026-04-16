import { TRPCError } from '@trpc/server';
import { and, count, desc, eq, gte, inArray, isNotNull, lte, notInArray, sql, sum } from 'drizzle-orm';
import { z } from 'zod';

import {
  lawyerCase,
  lawyerCaseHearing,
  lawyerClient,
  lawyerInvoice,
  lawyerInvoicePayment,
  lawyerTimeEntry,
} from '@kb/database/schema';

import { lawyerProcedure, router } from '../init';

const rangeInput = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
});

function assertRange(from: Date, to: Date) {
  if (from.getTime() > to.getTime()) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: '"from" must be before "to".' });
  }
}

export const practiceAnalyticsRouter = router({
  summary: lawyerProcedure.input(rangeInput).query(async ({ ctx, input }) => {
    assertRange(input.from, input.to);
    const lawyerUserId = ctx.authUserId;
    const from = input.from;
    const to = input.to;

    const [activeRow] = await ctx.db
      .select({ c: count() })
      .from(lawyerCase)
      .where(
        and(
          eq(lawyerCase.lawyerUserId, lawyerUserId),
          notInArray(lawyerCase.status, ['closed', 'appealed']),
        ),
      );

    const [closedRow] = await ctx.db
      .select({ c: count() })
      .from(lawyerCase)
      .where(
        and(eq(lawyerCase.lawyerUserId, lawyerUserId), inArray(lawyerCase.status, ['closed', 'appealed'])),
      );

    const [hearingsRow] = await ctx.db
      .select({ c: count() })
      .from(lawyerCaseHearing)
      .innerJoin(lawyerCase, eq(lawyerCaseHearing.caseId, lawyerCase.id))
      .where(
        and(
          eq(lawyerCase.lawyerUserId, lawyerUserId),
          gte(lawyerCaseHearing.hearingAt, from),
          lte(lawyerCaseHearing.hearingAt, to),
        ),
      );

    const [revenueRow] = await ctx.db
      .select({ s: sum(lawyerInvoicePayment.amountInr) })
      .from(lawyerInvoicePayment)
      .innerJoin(lawyerInvoice, eq(lawyerInvoicePayment.invoiceId, lawyerInvoice.id))
      .where(
        and(
          eq(lawyerInvoice.lawyerUserId, lawyerUserId),
          eq(lawyerInvoicePayment.status, 'paid'),
          gte(lawyerInvoicePayment.paidAt, from),
          lte(lawyerInvoicePayment.paidAt, to),
        ),
      );

    const decidedOutcomes = ['won', 'lost', 'settled', 'withdrawn'] as const;

    const [decidedRow] = await ctx.db
      .select({ c: count() })
      .from(lawyerCase)
      .where(
        and(
          eq(lawyerCase.lawyerUserId, lawyerUserId),
          eq(lawyerCase.status, 'closed'),
          inArray(lawyerCase.caseOutcome, [...decidedOutcomes]),
        ),
      );

    const [wonOnly] = await ctx.db
      .select({ c: count() })
      .from(lawyerCase)
      .where(
        and(
          eq(lawyerCase.lawyerUserId, lawyerUserId),
          eq(lawyerCase.status, 'closed'),
          eq(lawyerCase.caseOutcome, 'won'),
        ),
      );

    const decided = Number(decidedRow?.c ?? 0);
    const won = Number(wonOnly?.c ?? 0);
    const winRatePercent = decided > 0 ? Math.round((100 * won) / decided) : null;

    const [newClientsRow] = await ctx.db
      .select({ c: count() })
      .from(lawyerClient)
      .where(
        and(
          eq(lawyerClient.lawyerUserId, lawyerUserId),
          gte(lawyerClient.createdAt, from),
          lte(lawyerClient.createdAt, to),
        ),
      );

    const repeatClients = await ctx.db
      .select({ clientId: lawyerCase.lawyerClientId, n: count() })
      .from(lawyerCase)
      .where(
        and(
          eq(lawyerCase.lawyerUserId, lawyerUserId),
          sql`${lawyerCase.lawyerClientId} is not null`,
          gte(lawyerCase.createdAt, from),
          lte(lawyerCase.createdAt, to),
        ),
      )
      .groupBy(lawyerCase.lawyerClientId)
      .having(sql`count(*) > 1`);

    const [hoursRow] = await ctx.db
      .select({ s: sum(lawyerTimeEntry.durationSeconds) })
      .from(lawyerTimeEntry)
      .where(
        and(
          eq(lawyerTimeEntry.lawyerUserId, lawyerUserId),
          isNotNull(lawyerTimeEntry.endedAt),
          gte(lawyerTimeEntry.endedAt, from),
          lte(lawyerTimeEntry.endedAt, to),
        ),
      );

    const hours = Number(hoursRow?.s ?? 0) / 3600;

    return {
      activeCases: Number(activeRow?.c ?? 0),
      closedOrAppealedCases: Number(closedRow?.c ?? 0),
      hearingsInRange: Number(hearingsRow?.c ?? 0),
      revenuePaidInr: Number(revenueRow?.s ?? 0),
      winRatePercent,
      decidedCasesForWinRate: decided,
      newClientsInRange: Number(newClientsRow?.c ?? 0),
      repeatClientsWithMultipleCasesInRange: repeatClients.length,
      billableHoursInRange: Math.round(hours * 100) / 100,
    };
  }),

  revenueCsv: lawyerProcedure.input(rangeInput).query(async ({ ctx, input }) => {
    assertRange(input.from, input.to);
    const lawyerUserId = ctx.authUserId;
    const rows = await ctx.db
      .select({
        paidAt: lawyerInvoicePayment.paidAt,
        invoiceNumber: lawyerInvoice.invoiceNumber,
        clientName: lawyerInvoice.clientName,
        amountInr: lawyerInvoicePayment.amountInr,
        totalInr: lawyerInvoice.totalInr,
        taxableInr: lawyerInvoice.taxableInr,
        cgstInr: lawyerInvoice.cgstInr,
        sgstInr: lawyerInvoice.sgstInr,
        igstInr: lawyerInvoice.igstInr,
      })
      .from(lawyerInvoicePayment)
      .innerJoin(lawyerInvoice, eq(lawyerInvoicePayment.invoiceId, lawyerInvoice.id))
      .where(
        and(
          eq(lawyerInvoice.lawyerUserId, lawyerUserId),
          eq(lawyerInvoicePayment.status, 'paid'),
          gte(lawyerInvoicePayment.paidAt, input.from),
          lte(lawyerInvoicePayment.paidAt, input.to),
        ),
      )
      .orderBy(desc(lawyerInvoicePayment.paidAt));

    const header = [
      'paid_at',
      'invoice_number',
      'client_name',
      'payment_inr',
      'invoice_total_inr',
      'taxable_inr',
      'cgst_inr',
      'sgst_inr',
      'igst_inr',
    ].join(',');
    const escape = (v: string | number | null | undefined) => {
      if (v == null) return '';
      const s = String(v);
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const lines = rows.map((r) =>
      [
        r.paidAt?.toISOString() ?? '',
        r.invoiceNumber,
        r.clientName,
        r.amountInr,
        r.totalInr,
        r.taxableInr,
        r.cgstInr,
        r.sgstInr,
        r.igstInr,
      ]
        .map(escape)
        .join(','),
    );
    const csv = [header, ...lines].join('\n');
    const fn = `revenue-${input.from.toISOString().slice(0, 10)}-${input.to.toISOString().slice(0, 10)}.csv`;
    return { filename: fn, csv };
  }),
});
