'use client';

import Link from 'next/link';
import { useState } from 'react';

import { trpc } from '@kb/api-client';

export function ResearchMapper() {
  const [source, setSource] = useState('IPC');
  const [section, setSection] = useState('302');
  const [target, setTarget] = useState('BNS');
  const [submitted, setSubmitted] = useState<{
    sourceStatute: string;
    sourceSection: string;
    targetStatute?: string;
  } | null>(null);
  const q = trpc.research.statutes.crosswalk.useQuery(
    {
      sourceStatute: submitted?.sourceStatute ?? 'IPC',
      sourceSection: submitted?.sourceSection ?? '302',
      targetStatute: submitted?.targetStatute,
    },
    { enabled: submitted !== null },
  );

  return (
    <div className="space-y-6" style={{ fontFamily: 'var(--font-body)' }}>
      <Link href="/app/research" className="text-sm text-[#C2410C] hover:underline">
        ← Research home
      </Link>
      <h1 className="text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
        Statute crosswalk
      </h1>
      <p className="text-xs text-[#78716C]">
        Illustrative IPC / CrPC / IEA → BNS / BNSS / BSA mappings from seed data. Always verify against official
        conversion tables before filing.
      </p>
      <div className="grid max-w-lg gap-3 sm:grid-cols-3">
        <label className="text-sm">
          <span className="text-[#44403C]">Source</span>
          <input
            className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-2 py-1 text-sm"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="text-[#44403C]">Section</span>
          <input
            className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-2 py-1 text-sm"
            value={section}
            onChange={(e) => setSection(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="text-[#44403C]">Target act</span>
          <input
            className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-2 py-1 text-sm"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="BNS / BNSS / BSA"
          />
        </label>
      </div>
      <button
        type="button"
        className="rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white"
        onClick={() =>
          setSubmitted({
            sourceStatute: source.trim(),
            sourceSection: section.trim(),
            targetStatute: target.trim() || undefined,
          })
        }
      >
        Lookup
      </button>
      {submitted !== null && q.isFetching ? <p className="text-sm text-[#57534E]">Loading…</p> : null}
      {q.isError ? <p className="text-sm text-red-700">{q.error.message}</p> : null}
      {submitted !== null && q.data ? (
        <ul className="rounded-xl border border-[#E7E5E4] bg-white p-4 text-sm shadow-sm">
          {q.data.rows.length === 0 ? (
            <li className="text-[#78716C]">No mapping in seed data.</li>
          ) : (
            q.data.rows.map((r) => (
              <li key={`${r.sourceStatute}-${r.sourceSection}-${r.targetStatute}`} className="py-2">
                <span className="font-medium">
                  {r.sourceStatute} {r.sourceSection}
                </span>
                {' → '}
                <span className="font-medium">
                  {r.targetStatute} {r.targetSection}
                </span>
                {r.note ? <p className="mt-1 text-xs text-[#57534E]">{r.note}</p> : null}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
