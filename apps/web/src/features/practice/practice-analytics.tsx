'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { trpc } from '@kb/api-client';

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function PracticeAnalytics() {
  const [fromStr, setFromStr] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toInputDate(d);
  });
  const [toStr, setToStr] = useState(() => toInputDate(new Date()));

  const range = useMemo(() => {
    const from = new Date(`${fromStr}T00:00:00`);
    const to = new Date(`${toStr}T23:59:59.999`);
    return { from, to };
  }, [fromStr, toStr]);

  const summary = trpc.practice.analytics.summary.useQuery(range, { enabled: Boolean(fromStr && toStr) });
  const csv = trpc.practice.analytics.revenueCsv.useQuery(range, { enabled: false });

  async function downloadCsv() {
    const r = await csv.refetch();
    if (!r.data) return;
    const blob = new Blob([r.data.csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = r.data.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8" style={{ fontFamily: 'var(--font-body)' }}>
      <div>
        <Link href="/app/practice" className="text-sm text-[#C2410C] hover:underline">
          ← Practice
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
          Practice analytics
        </h1>
        <p className="mt-1 text-sm text-[#57534E]">Cases, revenue, and billable time for the selected range.</p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm">
        <label className="text-sm">
          <span className="text-[#44403C]">From</span>
          <input
            type="date"
            className="mt-1 block rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
            value={fromStr}
            onChange={(e) => setFromStr(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="text-[#44403C]">To</span>
          <input
            type="date"
            className="mt-1 block rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
            value={toStr}
            onChange={(e) => setToStr(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="rounded-xl border border-[#D6D3D1] bg-white px-4 py-2 text-sm font-semibold text-[#44403C] hover:bg-[#FAFAF9]"
          onClick={() => void downloadCsv()}
        >
          Export revenue CSV
        </button>
      </div>

      {summary.isPending ? (
        <p className="text-sm text-[#57534E]">Loading…</p>
      ) : summary.isError ? (
        <p className="text-sm text-red-700">{summary.error.message}</p>
      ) : summary.data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat label="Active cases" value={summary.data.activeCases} />
          <Stat label="Closed / appealed" value={summary.data.closedOrAppealedCases} />
          <Stat label="Hearings in range" value={summary.data.hearingsInRange} />
          <Stat label="Revenue (paid, INR)" value={summary.data.revenuePaidInr} />
          <Stat
            label="Win rate"
            value={summary.data.winRatePercent == null ? '—' : `${summary.data.winRatePercent}%`}
            hint={`${summary.data.decidedCasesForWinRate} decided`}
          />
          <Stat label="New clients" value={summary.data.newClientsInRange} />
          <Stat label="Repeat clients (2+ cases)" value={summary.data.repeatClientsWithMultipleCasesInRange} />
          <Stat label="Billable hours" value={summary.data.billableHoursInRange} />
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-[#78716C]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[#1C1917]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[#78716C]">{hint}</p> : null}
    </div>
  );
}
