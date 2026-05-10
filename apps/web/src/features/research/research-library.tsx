'use client';

import Link from 'next/link';
import { useState } from 'react';

import { trpc } from '@jurisly/api-client';

export function ResearchLibrary() {
  const [q, setQ] = useState('');
  const list = trpc.research.acts.list.useQuery({});
  const search = trpc.research.acts.search.useQuery(
    { query: q.trim() || undefined },
    { enabled: q.trim().length > 0 },
  );

  const acts = q.trim().length > 0 ? search.data?.acts : list.data?.acts;

  return (
    <div className="space-y-6" style={{ fontFamily: 'var(--font-body)' }}>
      <Link href="/app/research" className="text-sm text-[#C2410C] hover:underline">
        ← Research home
      </Link>
      <h1
        className="text-xl font-semibold text-[#1C1917]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Law library
      </h1>
      <input
        className="w-full max-w-md rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
        placeholder="Filter by title…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {list.isPending && q.trim().length === 0 ? (
        <p className="text-sm text-[#57534E]">Loading…</p>
      ) : search.isFetching && q.trim().length > 0 ? (
        <p className="text-sm text-[#57534E]">Searching…</p>
      ) : (
        <ul className="divide-y divide-[#E7E5E4] rounded-xl border border-[#E7E5E4] bg-white shadow-sm">
          {(acts ?? []).map((a) => (
            <li key={a.id} className="px-4 py-3 text-sm">
              <span className="font-medium text-[#1C1917]">{a.shortTitle}</span>
              <span className="mt-1 block text-xs text-[#78716C]">
                {a.category}
                {a.year ? ` · ${a.year}` : ''}
              </span>
              {a.sourceUrl ? (
                <a
                  href={a.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs text-[#C2410C] hover:underline"
                >
                  India Code
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
