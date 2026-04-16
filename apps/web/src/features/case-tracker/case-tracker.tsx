'use client';

import { useMemo, useState } from 'react';

import { trpc } from '@kb/api-client';

export function CaseTracker() {
  const [cnr, setCnr] = useState('');
  const [submitted, setSubmitted] = useState<string | null>(null);

  const lookup = trpc.caseTracker.lookupByCnr.useQuery(
    { cnr: submitted ?? '' },
    { enabled: Boolean(submitted) },
  );

  const me = trpc.profile.me.useQuery(undefined, { staleTime: 60_000 });
  const canTrack = Boolean(me.data?.user?.id);

  const list = trpc.caseTracker.list.useQuery(undefined, { enabled: canTrack });
  const utils = trpc.useUtils();
  const track = trpc.caseTracker.track.useMutation({
    onSuccess: async () => {
      await utils.caseTracker.list.invalidate();
    },
  });
  const untrack = trpc.caseTracker.untrack.useMutation({
    onSuccess: async () => {
      await utils.caseTracker.list.invalidate();
    },
  });

  const normalizedCnr = useMemo(() => (lookup.data?.cnr ? lookup.data.cnr : null), [lookup.data?.cnr]);
  const isTracked = Boolean(
    normalizedCnr && list.data?.some((t) => t.cnr === normalizedCnr && t.enabled),
  );

  return (
    <div className="space-y-8" style={{ fontFamily: 'var(--font-body)' }}>
      <div>
        <h1 className="text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
          Case tracker (NJDG)
        </h1>
        <p className="mt-1 text-sm text-[#57534E]">Enter a CNR number to fetch the latest public case status.</p>
      </div>

      <section className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <input
            className="w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm sm:w-[360px]"
            placeholder="e.g. ABCD123456789012"
            value={cnr}
            onChange={(e) => setCnr(e.target.value)}
          />
          <button
            type="button"
            className="rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9a3409]"
            onClick={() => setSubmitted(cnr.trim())}
          >
            Lookup
          </button>
        </div>
        {lookup.isPending ? <p className="mt-3 text-sm text-[#57534E]">Loading…</p> : null}
        {lookup.isError ? <p className="mt-3 text-sm text-red-700">{lookup.error.message}</p> : null}

        {lookup.data ? (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-[#44403C]">
                CNR: <span className="font-semibold">{lookup.data.cnr}</span>
              </p>
              {canTrack ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-[#C2410C] hover:underline disabled:opacity-60"
                  disabled={track.isPending || untrack.isPending}
                  onClick={() =>
                    void (isTracked
                      ? untrack.mutateAsync({ cnr: lookup.data.cnr })
                      : track.mutateAsync({ cnr: lookup.data.cnr }))
                  }
                >
                  {isTracked ? 'Untrack' : 'Track for updates'}
                </button>
              ) : null}
            </div>
            <pre className="max-h-[420px] overflow-auto rounded-lg bg-[#0c0a09] p-3 text-xs text-[#fafaf9]">
              {JSON.stringify(lookup.data.snapshot, null, 2)}
            </pre>
          </div>
        ) : null}
      </section>

      {canTrack ? (
        <section className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[#1C1917]">Tracked cases</h2>
          {list.isPending ? (
            <p className="mt-2 text-sm text-[#57534E]">Loading…</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {list.data?.filter((t) => t.enabled).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2">
                  <span className="text-[#44403C]">{t.cnr}</span>
                  <button
                    type="button"
                    className="text-xs font-semibold text-red-700 hover:underline"
                    onClick={() => void untrack.mutateAsync({ cnr: t.cnr })}
                  >
                    Remove
                  </button>
                </li>
              ))}
              {list.data?.filter((t) => t.enabled).length === 0 ? (
                <li className="text-[#78716C]">No tracked cases.</li>
              ) : null}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}

