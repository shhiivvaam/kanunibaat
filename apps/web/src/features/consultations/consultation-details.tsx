'use client';

import { trpc } from '@kb/api-client';

export function ConsultationDetails({ consultationId }: { consultationId: string }) {
  const q = trpc.consultations.byId.useQuery({ consultationId }, { refetchInterval: 5000 });
  const start = trpc.consultations.start.useMutation({ onSuccess: async () => q.refetch() });
  const end = trpc.consultations.end.useMutation({ onSuccess: async () => q.refetch() });

  if (q.isPending) return <p className="text-sm text-[#78716C]">Loading…</p>;
  if (q.isError) return <p className="text-sm text-red-700">{q.error.message}</p>;

  const c = q.data.consultation;
  const p = q.data.payment;

  return (
    <section className="rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
            {c.mode.toUpperCase()} consultation
          </h1>
          <p className="mt-1 text-sm text-[#57534E]" style={{ fontFamily: 'var(--font-body)' }}>
            Status: <span className="font-semibold">{c.status.replaceAll('_', ' ')}</span>
          </p>
          <p className="mt-1 text-sm text-[#57534E]" style={{ fontFamily: 'var(--font-body)' }}>
            Scheduled: {c.scheduledAt ? new Date(c.scheduledAt).toLocaleString() : 'Not scheduled'}
          </p>
          <p className="mt-1 text-sm text-[#57534E]" style={{ fontFamily: 'var(--font-body)' }}>
            Payment: {p ? p.status : 'none'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={start.isPending || c.status !== 'scheduled'}
            onClick={() => start.mutate({ consultationId })}
            className="rounded-xl border border-[#E7E5E4] bg-white px-4 py-2 text-sm font-semibold text-[#44403C] hover:bg-[#FAFAF9] disabled:opacity-60"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Start
          </button>
          <button
            type="button"
            disabled={end.isPending || c.status !== 'in_progress'}
            onClick={() => end.mutate({ consultationId })}
            className="rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9A3412] disabled:opacity-60"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Complete
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-[#FAFAF9] p-4 ring-1 ring-[#E7E5E4]">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#78716C]">Issue summary</p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-[#1C1917]" style={{ fontFamily: 'var(--font-body)' }}>
          {c.issueSummary}
        </p>
      </div>
    </section>
  );
}

