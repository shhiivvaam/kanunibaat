'use client';

import Link from 'next/link';
import { useState } from 'react';

import { trpc } from '@jurisly/api-client';

export function ResearchJudgments() {
  const [draftQ, setDraftQ] = useState('');
  const [draftExpand, setDraftExpand] = useState(false);
  const [run, setRun] = useState({ query: '', expandQuery: false, seq: 0 });

  const search = trpc.research.judgments.search.useQuery(
    { query: run.query, limit: 20, expandQuery: run.expandQuery || undefined },
    { enabled: run.seq > 0 },
  );

  return (
    <div className="space-y-6" style={{ fontFamily: 'var(--font-body)' }}>
      <Link href="/app/research" className="text-sm text-[#C2410C] hover:underline">
        ← Research home
      </Link>
      <h1
        className="text-xl font-semibold text-[#1C1917]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Judgment search
      </h1>
      <div className="flex flex-wrap gap-2">
        <input
          className="min-w-[200px] flex-1 rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
          placeholder="Keywords or natural language…"
          value={draftQ}
          onChange={(e) => setDraftQ(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-[#44403C]">
          <input
            type="checkbox"
            checked={draftExpand}
            onChange={(e) => setDraftExpand(e.target.checked)}
          />
          Expand query (AI)
        </label>
        <button
          type="button"
          className="rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9a3409]"
          onClick={() =>
            setRun((s) => ({
              query: draftQ,
              expandQuery: draftExpand,
              seq: s.seq + 1,
            }))
          }
        >
          Search
        </button>
      </div>
      <p className="text-xs text-[#78716C]">
        {run.seq > 0 && search.data
          ? `Source: ${search.data.source}`
          : 'Run a search to see Meilisearch vs Postgres.'}
        {draftExpand ? ' · NL expansion requires OPENAI_API_KEY on the API.' : ''}
      </p>
      {run.seq === 0 ? (
        <p className="text-sm text-[#78716C]">
          Click Search (empty query lists recent matches from the corpus).
        </p>
      ) : search.isFetching ? (
        <p className="text-sm text-[#57534E]">Searching…</p>
      ) : search.isError ? (
        <p className="text-sm text-red-700">{search.error.message}</p>
      ) : (
        <ul className="divide-y divide-[#E7E5E4] rounded-xl border border-[#E7E5E4] bg-white shadow-sm">
          {(search.data?.hits ?? []).map((h) => (
            <li key={h.id}>
              <Link
                href={`/app/research/judgments/${h.id}`}
                className="block px-4 py-3 text-sm hover:bg-[#FAFAF9]"
              >
                <span className="font-medium text-[#1C1917]">{h.title}</span>
                <span className="mt-1 block text-xs text-[#78716C]">
                  {h.citation} · {h.court}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
