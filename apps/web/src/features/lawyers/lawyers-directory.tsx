'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { trpc } from '@jurisly/api-client';

export function LawyersDirectory() {
  const searchParams = useSearchParams();
  const urlQ = searchParams.get('q') ?? '';
  const [q, setQ] = useState(urlQ);
  const [debounced, setDebounced] = useState(urlQ.trim());

  useEffect(() => {
    setQ(urlQ);
    setDebounced(urlQ.trim());
  }, [urlQ]);
  const query = trpc.marketplace.searchLawyers.useQuery(
    { query: debounced, limit: 24 },
    { staleTime: 30_000 },
  );

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="space-y-8">
      <div>
        <label htmlFor="lawyer-search" className="sr-only">
          Search lawyers
        </label>
        <input
          id="lawyer-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, city, practice area…"
          className="w-full rounded-2xl border border-[#E7E5E4] bg-white px-4 py-3 text-sm text-[#1C1917] shadow-sm outline-none ring-[#C2410C] focus:ring-2"
          style={{ fontFamily: 'var(--font-body)' }}
        />
        {query.data ? (
          <p className="mt-2 text-xs text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
            Results via {query.data.source === 'meilisearch' ? 'Meilisearch' : 'database'} (always
            consistent listing).
          </p>
        ) : null}
      </div>

      {query.isPending ? (
        <p className="text-sm text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
          Loading directory…
        </p>
      ) : query.isError ? (
        <p className="text-sm text-red-700" style={{ fontFamily: 'var(--font-body)' }}>
          {query.error.message}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {(query.data?.hits ?? []).map((h) => (
            <li key={h.userId}>
              <Link
                href={`/lawyers/${h.slug}`}
                className="block rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-sm transition hover:border-[#C2410C]/40 hover:shadow-md"
              >
                <h2
                  className="text-lg font-semibold text-[#1C1917]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {h.displayName ?? 'Verified lawyer'}
                </h2>
                {h.headline ? (
                  <p
                    className="mt-1 text-sm text-[#57534E]"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {h.headline}
                  </p>
                ) : null}
                <dl
                  className="mt-3 space-y-1 text-xs text-[#78716C]"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {h.city ? (
                    <div>
                      <dt className="inline font-medium text-[#44403C]">City: </dt>
                      <dd className="inline">{h.city}</dd>
                    </div>
                  ) : null}
                  {h.barState ? (
                    <div>
                      <dt className="inline font-medium text-[#44403C]">Bar: </dt>
                      <dd className="inline">{h.barState}</dd>
                    </div>
                  ) : null}
                  {h.practiceAreas.length > 0 ? (
                    <div>
                      <dt className="font-medium text-[#44403C]">Practice areas</dt>
                      <dd className="mt-0.5 text-[#57534E]">{h.practiceAreas.join(' · ')}</dd>
                    </div>
                  ) : null}
                </dl>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!query.isPending && !query.isError && (query.data?.hits.length ?? 0) === 0 ? (
        <p className="text-sm text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
          No verified lawyers match yet. Check back as we onboard advocates across India.
        </p>
      ) : null}
    </div>
  );
}
