'use client';

import Link from 'next/link';

import { trpc } from '@kb/api-client';

export function ConsultationsList() {
  const q = trpc.consultations.me.useQuery();

  if (q.isPending) return <p className="text-sm text-[#78716C]">Loading…</p>;
  if (q.isError) return <p className="text-sm text-red-700">{q.error.message}</p>;

  const rows = q.data ?? [];
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-[#E7E5E4] bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-[#57534E]" style={{ fontFamily: 'var(--font-body)' }}>
          No consultations yet.
        </p>
        <Link
          href="/lawyers"
          className="mt-4 inline-block text-sm font-semibold text-[#C2410C] hover:underline"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Find a lawyer
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((c) => (
        <Link
          key={c.id}
          href={`/app/consultations/${c.id}`}
          className="block rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-sm hover:border-[#FDBA74]"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
              {c.mode.toUpperCase()} · {c.status.replaceAll('_', ' ')}
            </p>
            <p className="text-xs text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
              {c.scheduledAt ? new Date(c.scheduledAt).toLocaleString() : 'Not scheduled'}
            </p>
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-[#44403C]" style={{ fontFamily: 'var(--font-body)' }}>
            {c.issueSummary}
          </p>
        </Link>
      ))}
    </div>
  );
}

