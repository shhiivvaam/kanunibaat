'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { trpc } from '@kb/api-client';

const STATUSES = [
  'intake',
  'active',
  'hearing_scheduled',
  'pending_docs',
  'judgement',
  'closed',
  'appealed',
] as const;

const COURT_TYPES = ['district', 'high_court', 'supreme_court', 'tribunal', 'other'] as const;

export function PracticeCaseNew() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const clients = trpc.cases.client.list.useQuery();
  const create = trpc.cases.case.create.useMutation({
    onSuccess: async (data) => {
      await utils.cases.case.list.invalidate();
      if (data.case?.id) {
        router.push(`/app/practice/cases/${data.case.id}`);
      }
    },
  });

  const [lawyerClientId, setLawyerClientId] = useState('');
  const [clientDisplayName, setClientDisplayName] = useState('');
  const [courtName, setCourtName] = useState('');
  const [courtType, setCourtType] = useState<(typeof COURT_TYPES)[number]>('other');
  const [caseType, setCaseType] = useState('');
  const [cnrNumber, setCnrNumber] = useState('');
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('intake');
  const [description, setDescription] = useState('');

  return (
    <div className="space-y-6" style={{ fontFamily: 'var(--font-body)' }}>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
          New case
        </h1>
        <Link href="/app/practice/cases" className="text-sm text-[#C2410C] hover:underline">
          Cancel
        </Link>
      </div>

      <div className="grid gap-4 rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2">
          <span className="text-[#44403C]">Linked client (optional)</span>
          <select
            className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
            value={lawyerClientId}
            onChange={(e) => setLawyerClientId(e.target.value)}
          >
            <option value="">None</option>
            {(clients.data?.clients ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.displayName}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-[#44403C]">Offline client name (if no CRM link)</span>
          <input
            className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
            value={clientDisplayName}
            onChange={(e) => setClientDisplayName(e.target.value)}
            placeholder="Optional"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-[#44403C]">Court / matter title</span>
          <input
            className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
            value={courtName}
            onChange={(e) => setCourtName(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-[#44403C]">Court type</span>
          <select
            className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
            value={courtType}
            onChange={(e) => setCourtType(e.target.value as (typeof COURT_TYPES)[number])}
          >
            {COURT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-[#44403C]">Case type</span>
          <input
            className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
            value={caseType}
            onChange={(e) => setCaseType(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-[#44403C]">CNR</span>
          <input
            className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
            value={cnrNumber}
            onChange={(e) => setCnrNumber(e.target.value)}
            placeholder="Optional"
          />
        </label>
        <label className="block text-sm">
          <span className="text-[#44403C]">Status</span>
          <select
            className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-[#44403C]">Description</span>
          <textarea
            className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
      </div>

      <button
        type="button"
        disabled={create.isPending}
        onClick={() =>
          void create.mutateAsync({
            lawyerClientId: lawyerClientId || null,
            clientDisplayName: clientDisplayName.trim() || null,
            courtName: courtName.trim() || undefined,
            courtType,
            caseType: caseType.trim(),
            cnrNumber: cnrNumber.trim() || null,
            status,
            description: description.trim(),
          })
        }
        className="rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9a3409] disabled:opacity-50"
      >
        Create case
      </button>
      {create.error ? <p className="text-sm text-red-700">{create.error.message}</p> : null}
    </div>
  );
}
