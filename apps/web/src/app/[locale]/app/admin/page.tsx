'use client';

import { trpc } from '@jurisly/api-client';
import { useState } from 'react';

export default function AdminQueuePage() {
  const utils = trpc.useUtils();
  const pending = trpc.admin.pendingLawyers.useQuery(undefined, { staleTime: 15_000 });
  const approve = trpc.admin.approveLawyer.useMutation({
    onSuccess: () => void utils.admin.pendingLawyers.invalidate(),
  });
  const reject = trpc.admin.rejectLawyer.useMutation({
    onSuccess: () => void utils.admin.pendingLawyers.invalidate(),
  });
  const [reasonByUser, setReasonByUser] = useState<Record<string, string>>({});

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-semibold text-[#1C1917]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Lawyer verification
        </h1>
        <p
          className="mt-2 text-sm text-[#57534E]"
          style={{ fontFamily: 'var(--font-body)', lineHeight: 1.6 }}
        >
          Review pending advocates, inspect uploaded documents metadata, then approve or reject. All
          actions are enforced again on the API (admin role required).
        </p>
      </div>

      {pending.isPending ? (
        <p className="text-sm text-[#78716C]">Loading queue…</p>
      ) : pending.isError ? (
        <p className="text-sm text-red-700">{pending.error.message}</p>
      ) : (
        <ul className="space-y-6">
          {pending.data?.lawyers.map((row) => (
            <li
              key={row.userId}
              className="rounded-2xl border border-[#E7E5E4] bg-white p-6 shadow-sm"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#1C1917]">
                    {row.displayName ?? row.email}
                  </h2>
                  <p className="text-xs text-[#78716C]">{row.email}</p>
                  <p className="mt-2 text-sm text-[#44403C]">
                    <span className="font-medium">Slug:</span> {row.slug}
                  </p>
                  <p className="text-sm text-[#44403C]">
                    <span className="font-medium">Bar state:</span> {row.barState ?? '—'}
                  </p>
                  <p className="text-sm text-[#44403C]">
                    <span className="font-medium">Enrollment:</span> {row.enrollmentNumber ?? '—'}
                  </p>
                  {row.headline ? (
                    <p className="mt-2 text-sm text-[#57534E]">{row.headline}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                  <button
                    type="button"
                    disabled={approve.isPending}
                    onClick={() => approve.mutate({ userId: row.userId })}
                    className="rounded-xl bg-[#166534] px-4 py-2 text-sm font-semibold text-white hover:bg-[#14532d] disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <div className="flex w-full max-w-xs flex-col gap-1 sm:items-end">
                    <label className="sr-only" htmlFor={`reason-${row.userId}`}>
                      Rejection reason
                    </label>
                    <textarea
                      id={`reason-${row.userId}`}
                      rows={2}
                      placeholder="Optional rejection note"
                      value={reasonByUser[row.userId] ?? ''}
                      onChange={(e) =>
                        setReasonByUser((prev) => ({ ...prev, [row.userId]: e.target.value }))
                      }
                      className="w-full rounded-xl border border-[#E7E5E4] px-3 py-2 text-xs"
                    />
                    <button
                      type="button"
                      disabled={reject.isPending}
                      onClick={() =>
                        reject.mutate({
                          userId: row.userId,
                          reason: reasonByUser[row.userId]?.trim() || undefined,
                        })
                      }
                      className="rounded-xl border border-[#B91C1C] px-4 py-2 text-sm font-semibold text-[#B91C1C] hover:bg-red-50 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-4 border-t border-[#F5F5F4] pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[#78716C]">
                  Documents
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-[#44403C]">
                  {row.documents.length === 0 ? (
                    <li className="text-[#A8A29E]">
                      No document rows (unexpected for pending submission).
                    </li>
                  ) : (
                    row.documents.map((d) => (
                      <li key={d.id}>
                        <span className="font-medium">{d.kind}</span> — {d.fileName} (
                        {d.contentType}, {Math.round(d.byteSize / 1024)} KB)
                        {d.uploadedAt ? (
                          <span className="text-green-700"> · uploaded</span>
                        ) : (
                          <span className="text-amber-700"> · upload incomplete</span>
                        )}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!pending.isPending && !pending.isError && (pending.data?.lawyers.length ?? 0) === 0 ? (
        <p className="text-sm text-[#78716C]">No pending lawyers. You are all caught up.</p>
      ) : null}
    </div>
  );
}
