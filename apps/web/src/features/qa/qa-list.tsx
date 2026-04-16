'use client';

import Link from 'next/link';
import { useState } from 'react';

import { trpc } from '@kb/api-client';

export function QaList() {
  const [category, setCategory] = useState('');
  const [q, setQ] = useState('');

  const list = trpc.qa.question.list.useQuery({ category: category || undefined, q: q.trim() || undefined, limit: 30 });

  return (
    <div className="space-y-8" style={{ fontFamily: 'var(--font-body)' }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
            Legal Q&A
          </h1>
          <p className="mt-1 text-sm text-[#57534E]">Ask a question. Verified lawyers answer. AI gives a safe preview.</p>
        </div>
        <Link
          href="/legal-qa/ask"
          className="rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9a3409]"
        >
          Ask a question
        </Link>
      </div>

      <section className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <input
            className="w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm sm:w-[220px]"
            placeholder="Category (optional)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm sm:w-[320px]"
            placeholder="Search titles…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </section>

      {list.isPending ? <p className="text-sm text-[#57534E]">Loading…</p> : null}
      {list.isError ? <p className="text-sm text-red-700">{list.error.message}</p> : null}

      <div className="space-y-3">
        {list.data?.items.map((item) => (
          <Link
            key={item.id}
            href={`/legal-qa/${item.id}`}
            className="block rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm hover:border-[#D6D3D1]"
          >
            <p className="text-xs text-[#78716C]">
              {item.category || 'general'} · {item.answersCount} answers · {item.votesUp} upvotes
            </p>
            <p className="mt-1 text-sm font-semibold text-[#1C1917]">{item.title}</p>
            <p className="mt-1 line-clamp-2 text-sm text-[#57534E]">{item.body}</p>
          </Link>
        ))}
      </div>

      {list.data && list.data.items.length === 0 ? <p className="text-sm text-[#78716C]">No questions yet.</p> : null}
    </div>
  );
}

