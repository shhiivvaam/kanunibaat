'use client';

import Link from 'next/link';

import { trpc } from '@kb/api-client';

export function VaultList() {
  const q = trpc.vault.document.list.useQuery(undefined, { staleTime: 10_000 });

  if (q.isPending) {
    return <p className="text-sm text-[#57534E]">Loading vault…</p>;
  }
  if (q.error) {
    return <p className="text-sm text-red-700">{q.error.message}</p>;
  }

  const { documents, usage } = q.data;
  const usagePct = Math.min(100, Math.round((usage.totalBytes / usage.maxTotalBytes) * 100));

  const expiringBanner = documents.some((d) => d.expiringSoon);

  return (
    <div className="space-y-6" style={{ fontFamily: 'var(--font-body)' }}>
      <div>
        <h1 className="text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
          Document vault
        </h1>
        <p className="mt-2 text-sm text-[#57534E]">
          Client-encrypted storage for sensitive documents. Free tier: {usage.maxDocuments} documents,{' '}
          {Math.round(usage.maxTotalBytes / (1024 * 1024))} MB total.
        </p>
      </div>

      {expiringBanner ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Some documents expire within 30 days. Review expiry dates below.
        </div>
      ) : null}

      <div className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-[#44403C]">Storage used</span>
          <span className="text-[#78716C]">
            {usage.completeCount} / {usage.maxDocuments} docs · {Math.round(usage.totalBytes / 1024)} KB /{' '}
            {Math.round(usage.maxTotalBytes / (1024 * 1024))} MB
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E7E5E4]">
          <div className="h-full rounded-full bg-[#C2410C]" style={{ width: `${usagePct}%` }} />
        </div>
      </div>

      <div className="flex justify-end">
        <Link
          href="/app/vault/upload"
          className="rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9a3409]"
        >
          Upload document
        </Link>
      </div>

      {documents.length === 0 ? (
        <p className="text-sm text-[#57534E]">No documents yet.</p>
      ) : (
        <ul className="divide-y divide-[#E7E5E4] rounded-xl border border-[#E7E5E4] bg-white shadow-sm">
          {documents.map((d) => (
            <li key={d.id}>
              <Link
                href={`/app/vault/${d.id}`}
                className="flex flex-col gap-1 px-4 py-3 text-sm hover:bg-[#FAFAF9]"
              >
                <span className="font-medium text-[#1C1917]">{d.displayName}</span>
                <span className="text-xs text-[#78716C]">
                  {d.category} · {d.uploadStatus === 'complete' ? 'Ready' : 'Upload pending'}
                  {d.expiresAt ? ` · Expires ${new Date(d.expiresAt).toLocaleDateString()}` : ''}
                  {d.expiringSoon ? ' · Expiring soon' : ''}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
