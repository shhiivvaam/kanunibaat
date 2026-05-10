'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { trpc } from '@jurisly/api-client';

export function ResearchJudgmentDetail() {
  const params = useParams();
  const id = typeof params.judgmentId === 'string' ? params.judgmentId : '';
  const q = trpc.research.judgments.byId.useQuery({ id }, { enabled: Boolean(id) });
  const summarize = trpc.research.judgments.summarize.useMutation();
  const chain = trpc.research.citations.suggestChain.useMutation();
  const [citationJson, setCitationJson] = useState<string | null>(null);

  if (!id) {
    return <p className="text-sm text-red-700">Invalid judgment.</p>;
  }
  if (q.isPending) {
    return <p className="text-sm text-[#57534E]">Loading…</p>;
  }
  if (q.isError) {
    return <p className="text-sm text-red-700">{q.error.message}</p>;
  }

  const j = q.data.judgment;

  return (
    <div className="space-y-8" style={{ fontFamily: 'var(--font-body)' }}>
      <Link href="/app/research/judgments" className="text-sm text-[#C2410C] hover:underline">
        ← Judgments
      </Link>
      <div>
        <h1
          className="text-xl font-semibold text-[#1C1917]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {j.title}
        </h1>
        <p className="mt-1 text-sm text-[#78716C]">
          {j.citation} · {j.court}
        </p>
      </div>
      <section className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-[#1C1917]">Excerpt</h2>
        <p className="mt-2 text-sm text-[#44403C]">{j.summaryExcerpt || '—'}</p>
        <p className="mt-3 text-sm text-[#57534E] whitespace-pre-wrap">{j.bodyForSearch || ''}</p>
      </section>
      <section className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-[#1C1917]">AI summary</h2>
        <button
          type="button"
          className="mt-2 rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9a3409]"
          disabled={summarize.isPending}
          onClick={() => void summarize.mutateAsync({ id })}
        >
          Generate summary
        </button>
        {summarize.error ? (
          <p className="mt-2 text-sm text-red-700">{summarize.error.message}</p>
        ) : null}
        {summarize.data ? (
          <div className="mt-3 text-sm">
            <p className="text-[#44403C]">{summarize.data.summary.summary}</p>
            <ul className="mt-2 list-disc pl-5 text-[#57534E]">
              {summarize.data.summary.holdings.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
      <section className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-[#1C1917]">Citation chain (AI)</h2>
        <button
          type="button"
          className="mt-2 rounded-xl border border-[#D6D3D1] bg-white px-4 py-2 text-sm font-semibold text-[#44403C]"
          disabled={chain.isPending}
          onClick={async () => {
            setCitationJson(null);
            try {
              const r = await chain.mutateAsync({ seedCitation: j.citation });
              setCitationJson(JSON.stringify(r.nodes, null, 2));
            } catch {
              setCitationJson(null);
            }
          }}
        >
          Suggest related citations
        </button>
        {chain.error ? <p className="mt-2 text-sm text-red-700">{chain.error.message}</p> : null}
        {citationJson ? (
          <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-[#F5F5F4] p-3 text-xs">
            {citationJson}
          </pre>
        ) : null}
      </section>
    </div>
  );
}
