'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import { trpc } from '@jurisly/api-client';

export function PracticeDashboard() {
  const profile = trpc.profile.me.useQuery();
  const cases = trpc.cases.case.list.useQuery({});
  const range = useMemo(() => {
    const from = new Date();
    const to = new Date(from.getTime() + 7 * 86_400_000);
    return { from, to };
  }, []);
  const calendar = trpc.cases.calendar.upcoming.useQuery(range);

  if (profile.isPending) {
    return <p className="text-sm text-[#57534E]">Loading…</p>;
  }
  if (!profile.data?.roles.includes('lawyer')) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        Practice management is available to lawyers only. Complete lawyer onboarding and
        verification, or switch to a lawyer account.
      </div>
    );
  }

  const activeCases =
    cases.data?.cases.filter((c) => c.status !== 'closed' && c.status !== 'appealed').length ?? 0;

  return (
    <div className="space-y-8" style={{ fontFamily: 'var(--font-body)' }}>
      <div>
        <h1
          className="text-xl font-semibold text-[#1C1917]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Practice
        </h1>
        <p className="mt-2 text-sm text-[#57534E]">Cases, clients, hearings, and tasks.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-[#78716C]">Open cases</p>
          <p className="mt-1 text-2xl font-semibold text-[#1C1917]">
            {cases.isPending ? '—' : activeCases}
          </p>
        </div>
        <div className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-[#78716C]">Total cases</p>
          <p className="mt-1 text-2xl font-semibold text-[#1C1917]">
            {cases.isPending ? '—' : (cases.data?.cases.length ?? 0)}
          </p>
        </div>
        <div className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-[#78716C]">Next 7 days</p>
          <p className="mt-1 text-2xl font-semibold text-[#1C1917]">
            {calendar.isPending
              ? '—'
              : `${(calendar.data?.hearings.length ?? 0) + (calendar.data?.tasks.length ?? 0)} items`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/app/practice/clients"
          className="rounded-xl border border-[#D6D3D1] bg-white px-4 py-2 text-sm font-semibold text-[#44403C] hover:bg-[#FAFAF9]"
        >
          Clients
        </Link>
        <Link
          href="/app/practice/cases"
          className="rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9a3409]"
        >
          All cases
        </Link>
        <Link
          href="/app/practice/analytics"
          className="rounded-xl border border-[#D6D3D1] bg-white px-4 py-2 text-sm font-semibold text-[#44403C] hover:bg-[#FAFAF9]"
        >
          Analytics
        </Link>
        <Link
          href="/app/practice/invoices"
          className="rounded-xl border border-[#D6D3D1] bg-white px-4 py-2 text-sm font-semibold text-[#44403C] hover:bg-[#FAFAF9]"
        >
          Invoices
        </Link>
        <Link
          href="/app/practice/billing-settings"
          className="rounded-xl border border-[#D6D3D1] bg-white px-4 py-2 text-sm font-semibold text-[#44403C] hover:bg-[#FAFAF9]"
        >
          GST & firm
        </Link>
      </div>

      <section className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-[#1C1917]">Upcoming (7 days)</h2>
        {calendar.isError ? (
          <p className="mt-2 text-sm text-red-700">{calendar.error.message}</p>
        ) : calendar.isPending ? (
          <p className="mt-2 text-sm text-[#57534E]">Loading calendar…</p>
        ) : (
          <div className="mt-3 space-y-3 text-sm">
            {(calendar.data?.hearings.length ?? 0) === 0 &&
            (calendar.data?.tasks.length ?? 0) === 0 ? (
              <p className="text-[#78716C]">No hearings or tasks in this window.</p>
            ) : null}
            {calendar.data?.hearings.map((h) => (
              <div
                key={h.id}
                className="border-t border-[#F5F5F4] pt-2 first:border-t-0 first:pt-0"
              >
                <span className="font-medium text-[#44403C]">Hearing</span>{' '}
                <span className="text-[#78716C]">
                  {new Date(h.hearingAt).toLocaleString()} ·{' '}
                  {h.case.courtName || h.case.caseType || h.case.id}
                </span>
              </div>
            ))}
            {calendar.data?.tasks.map((t) => (
              <div key={t.id} className="border-t border-[#F5F5F4] pt-2">
                <span className="font-medium text-[#44403C]">Task</span>{' '}
                <span className="text-[#78716C]">
                  {t.title}
                  {t.dueAt ? ` · due ${new Date(t.dueAt).toLocaleDateString()}` : ''} ·{' '}
                  {t.case.courtName || t.case.caseType}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
