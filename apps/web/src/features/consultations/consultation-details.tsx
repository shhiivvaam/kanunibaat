'use client';

import { useState } from 'react';

import { trpc } from '@jurisly/api-client';

import { authClient } from '@/lib/auth-client';

export function ConsultationDetails({ consultationId }: { consultationId: string }) {
  const session = authClient.useSession();
  const q = trpc.consultations.byId.useQuery({ consultationId }, { refetchInterval: 5000 });
  const start = trpc.consultations.start.useMutation({ onSuccess: async () => q.refetch() });
  const end = trpc.consultations.end.useMutation({ onSuccess: async () => q.refetch() });
  const liveKitToken = trpc.consultations.liveKit.getToken.useMutation();
  const submitReview = trpc.consultations.submitVerifiedReview.useMutation({
    onSuccess: async () => q.refetch(),
  });
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  if (q.isPending) return <p className="text-sm text-[#78716C]">Loading…</p>;
  if (q.isError) return <p className="text-sm text-red-700">{q.error.message}</p>;

  const c = q.data.consultation;
  const p = q.data.payment;
  const existingReview = q.data.review;
  const isClient = session.data?.user?.id === c.userId;

  return (
    <section className="rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1
            className="text-lg font-semibold text-[#1C1917]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
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
        <p className="text-xs font-semibold uppercase tracking-wide text-[#78716C]">
          Issue summary
        </p>
        <p
          className="mt-2 whitespace-pre-wrap text-sm text-[#1C1917]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {c.issueSummary}
        </p>
      </div>

      {(c.mode === 'audio' || c.mode === 'video') &&
      (c.status === 'scheduled' || c.status === 'in_progress') ? (
        <div className="mt-5 rounded-xl border border-[#E7E5E4] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#78716C]">
            Live session (LiveKit)
          </p>
          <p className="mt-2 text-sm text-[#57534E]" style={{ fontFamily: 'var(--font-body)' }}>
            Request a short-lived join token, then open it in a LiveKit-compatible client (web or
            mobile SDK).
          </p>
          <button
            type="button"
            disabled={liveKitToken.isPending}
            onClick={async () => {
              const res = await liveKitToken.mutateAsync({ consultationId });
              await navigator.clipboard.writeText(
                JSON.stringify({ url: res.url, roomName: res.roomName, token: res.token }, null, 2),
              );
            }}
            className="mt-3 rounded-xl bg-[#1C1917] px-4 py-2 text-sm font-semibold text-white hover:bg-[#292524] disabled:opacity-60"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {liveKitToken.isPending ? 'Getting token…' : 'Copy join payload'}
          </button>
          {liveKitToken.isError ? (
            <p className="mt-2 text-sm text-red-700">{liveKitToken.error.message}</p>
          ) : null}
        </div>
      ) : null}

      {isClient && c.status === 'completed' && !existingReview ? (
        <div className="mt-5 rounded-xl border border-[#E7E5E4] bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#78716C]">
            Rate this consultation
          </p>
          <p className="mt-2 text-sm text-[#57534E]" style={{ fontFamily: 'var(--font-body)' }}>
            Verified clients can leave one rating per completed booking.
          </p>
          <label
            className="mt-3 block text-sm font-semibold text-[#1C1917]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Stars (1–5)
            <input
              type="number"
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="mt-1 w-24 rounded-lg border border-[#E7E5E4] px-2 py-1 text-sm"
            />
          </label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Optional short comment (max 2000 characters)"
            className="mt-3 min-h-[90px] w-full rounded-xl border border-[#E7E5E4] px-3 py-2 text-sm"
            maxLength={2000}
            style={{ fontFamily: 'var(--font-body)' }}
          />
          <button
            type="button"
            disabled={submitReview.isPending}
            onClick={() =>
              submitReview.mutate({
                consultationId,
                rating,
                reviewText: reviewText.trim() || undefined,
              })
            }
            className="mt-3 rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9A3412] disabled:opacity-60"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Submit review
          </button>
          {submitReview.isError ? (
            <p className="mt-2 text-sm text-red-700">{submitReview.error.message}</p>
          ) : null}
        </div>
      ) : null}

      {existingReview ? (
        <div className="mt-5 rounded-xl border border-[#D6D3D1] bg-[#FFF7ED] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#78716C]">
            Your review
          </p>
          <p className="mt-2 text-sm text-[#1C1917]" style={{ fontFamily: 'var(--font-body)' }}>
            {existingReview.rating} / 5
          </p>
          {existingReview.reviewText ? (
            <p
              className="mt-2 whitespace-pre-wrap text-sm text-[#44403C]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {existingReview.reviewText}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
