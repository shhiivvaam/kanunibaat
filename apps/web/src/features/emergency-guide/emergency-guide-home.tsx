'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { trpc } from '@jurisly/api-client';

import { HotlinesBar } from './hotlines-bar';
import { urgencyBadgeClass, urgencyLabel } from './urgency-styles';

export function EmergencyGuideHome() {
  const [q, setQ] = useState('');
  const list = trpc.emergencyGuide.list.useQuery();

  const filtered = useMemo(() => {
    const rows = list.data?.scenarios ?? [];
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (s) =>
        s.titleEn.toLowerCase().includes(needle) ||
        s.titleHi.includes(q.trim()) ||
        s.slug.includes(needle),
    );
  }, [list.data?.scenarios, q]);

  return (
    <div className="space-y-8">
      <HotlinesBar />

      <div>
        <label htmlFor="eg-search" className="sr-only">
          Search scenarios
        </label>
        <input
          id="eg-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Describe your situation…"
          className="w-full rounded-xl border border-[#E7E5E4] bg-white px-4 py-3 text-sm text-[#1C1917] outline-none focus:ring-2 focus:ring-[#FDBA74]"
          style={{ fontFamily: 'var(--font-body)' }}
        />
      </div>

      {list.isPending ? (
        <p className="text-sm text-[#78716C]">Loading scenarios…</p>
      ) : list.isError ? (
        <p className="text-sm text-red-700">{list.error.message}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {filtered.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/kya-karein/${s.slug}`}
                className="block h-full rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-sm transition hover:border-[#FDBA74]"
              >
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${urgencyBadgeClass(s.urgency)}`}
                >
                  {urgencyLabel(s.urgency)}
                </span>
                <h2
                  className="mt-3 text-base font-semibold text-[#1C1917]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {s.titleEn}
                </h2>
                <p
                  className="mt-1 text-sm text-[#57534E]"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {s.titleHi}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {list.data?.disclaimer ? (
        <p className="text-xs text-[#A8A29E]" style={{ fontFamily: 'var(--font-body)' }}>
          {list.data.disclaimer}
        </p>
      ) : null}
    </div>
  );
}
