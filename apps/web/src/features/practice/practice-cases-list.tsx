'use client';

import Link from 'next/link';
import { useState } from 'react';

import { trpc } from '@jurisly/api-client';

const STATUSES = [
  'intake',
  'active',
  'hearing_scheduled',
  'pending_docs',
  'judgement',
  'closed',
  'appealed',
] as const;

export function PracticeCasesList() {
  const [status, setStatus] = useState<(typeof STATUSES)[number] | ''>('');
  const q = trpc.cases.case.list.useQuery(status ? { status } : {});

  return (
    <div className="space-y-6" style={{ fontFamily: 'var(--font-body)' }}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1
          className="text-xl font-semibold text-[#1C1917]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Cases
        </h1>
        <div className="flex gap-3">
          <Link href="/app/practice" className="text-sm text-[#C2410C] hover:underline">
            Back
          </Link>
          <Link
            href="/app/practice/cases/new"
            className="rounded-xl bg-[#C2410C] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#9a3409]"
          >
            New case
          </Link>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <span className="text-[#57534E]">Status</span>
        <select
          className="rounded-lg border border-[#D6D3D1] px-2 py-1"
          value={status}
          onChange={(e) => setStatus((e.target.value || '') as typeof status)}
        >
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      {q.isPending ? (
        <p className="text-sm text-[#57534E]">Loading…</p>
      ) : q.isError ? (
        <p className="text-sm text-red-700">{q.error.message}</p>
      ) : (
        <ul className="divide-y divide-[#E7E5E4] rounded-xl border border-[#E7E5E4] bg-white shadow-sm">
          {(q.data?.cases ?? []).map((c) => (
            <li key={c.id}>
              <Link
                href={`/app/practice/cases/${c.id}`}
                className="block px-4 py-3 text-sm hover:bg-[#FAFAF9]"
              >
                <span className="font-medium text-[#1C1917]">
                  {c.courtName || c.caseType || 'Case'}
                </span>
                <span className="mt-1 block text-xs text-[#78716C]">
                  {c.status}
                  {c.cnrNumber ? ` · CNR ${c.cnrNumber}` : ''}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
