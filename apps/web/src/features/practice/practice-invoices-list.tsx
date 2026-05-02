'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { trpc } from '@jurisly/api-client';

export function PracticeInvoicesList() {
  const router = useRouter();
  const search = useSearchParams();
  const caseId = search.get('caseId');
  const list = trpc.practice.billing.invoice.list.useQuery({ limit: 80 });
  const createDraft = trpc.practice.billing.invoice.createDraft.useMutation({
    onSuccess: (d) => {
      if (d.invoice?.id) router.push(`/app/practice/invoices/${d.invoice.id}`);
    },
  });
  const [busy, setBusy] = useState(false);

  async function onNew() {
    setBusy(true);
    try {
      await createDraft.mutateAsync({
        caseId: caseId ?? undefined,
        issueDate: new Date(),
        clientName: '',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8" style={{ fontFamily: 'var(--font-body)' }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/app/practice" className="text-sm text-[#C2410C] hover:underline">
            ← Practice
          </Link>
          <h1
            className="mt-2 text-xl font-semibold text-[#1C1917]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Invoices
          </h1>
          <p className="mt-1 text-sm text-[#57534E]">Draft, send, collect payment, export PDF.</p>
          {caseId ? (
            <p className="mt-2 text-xs text-[#78716C]">
              New invoices will link to case <span className="font-mono">{caseId}</span>.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/app/practice/billing-settings"
            className="rounded-xl border border-[#D6D3D1] bg-white px-4 py-2 text-sm font-semibold text-[#44403C] hover:bg-[#FAFAF9]"
          >
            GST & firm
          </Link>
          <button
            type="button"
            className="rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9a3409] disabled:opacity-60"
            disabled={busy || createDraft.isPending}
            onClick={() => void onNew()}
          >
            New invoice
          </button>
        </div>
      </div>

      {list.isPending ? (
        <p className="text-sm text-[#57534E]">Loading…</p>
      ) : list.isError ? (
        <p className="text-sm text-red-700">{list.error.message}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#E7E5E4] bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[#E7E5E4] bg-[#FAFAF9] text-xs uppercase text-[#78716C]">
              <tr>
                <th className="px-4 py-2">Number</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Client</th>
                <th className="px-4 py-2 text-right">Total (INR)</th>
                <th className="px-4 py-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {(list.data ?? []).map((inv) => (
                <tr key={inv.id} className="border-b border-[#F5F5F4] last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/practice/invoices/${inv.id}`}
                      className="font-medium text-[#C2410C] hover:underline"
                    >
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[#57534E]">{inv.status}</td>
                  <td className="px-4 py-3 text-[#57534E]">{inv.clientName || '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{inv.totalInr}</td>
                  <td className="px-4 py-3 text-xs text-[#78716C]">
                    {new Date(inv.updatedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(list.data?.length ?? 0) === 0 ? (
            <p className="p-4 text-sm text-[#78716C]">No invoices yet.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
