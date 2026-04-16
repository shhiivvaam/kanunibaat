'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { trpc } from '@kb/api-client';

const CATEGORIES = [
  { id: '', label: 'All' },
  { id: 'tenant', label: 'Tenant' },
  { id: 'employment', label: 'Employee' },
  { id: 'consumer', label: 'Consumer' },
  { id: 'family', label: 'Family' },
  { id: 'women', label: 'Women' },
  { id: 'business', label: 'Business' },
] as const;

export function RightsList() {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]['id']>('');
  const [q, setQ] = useState('');

  const query = trpc.content.article.list.useQuery({ category: category || undefined, q: q.trim() || undefined, limit: 30 });

  const items = useMemo(() => query.data?.items ?? [], [query.data?.items]);

  return (
    <div className="space-y-8" style={{ fontFamily: 'var(--font-body)' }}>
      <div>
        <h1 className="text-2xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
          Aapke Huqooq
        </h1>
        <p className="mt-1 text-sm text-[#57534E]">Plain-language rights & law explainers (English + Hindi).</p>
      </div>

      <section className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${category === c.id ? 'border-[#C2410C] bg-[#FFF7ED] text-[#C2410C]' : 'border-[#E7E5E4] bg-white text-[#44403C]'
                }`}
              onClick={() => setCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
          <div className="flex-1" />
          <input
            className="w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm sm:w-[280px]"
            placeholder="Search by slug…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </section>

      {query.isPending ? <p className="text-sm text-[#57534E]">Loading…</p> : null}
      {query.isError ? <p className="text-sm text-red-700">{query.error.message}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((a) => (
          <Link
            key={a.id}
            href={`/rights/${a.slug}`}
            className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm hover:border-[#D6D3D1]"
          >
            <p className="text-xs text-[#78716C]">{a.category || 'general'}</p>
            <p className="mt-1 text-sm font-semibold text-[#1C1917]">
              {a.titleJson.en ?? a.slug}
            </p>
            <p className="mt-1 text-xs text-[#78716C]">{a.lifeSituation}</p>
          </Link>
        ))}
      </div>

      {items.length === 0 && !query.isPending ? <p className="text-sm text-[#78716C]">No published articles yet.</p> : null}
    </div>
  );
}

