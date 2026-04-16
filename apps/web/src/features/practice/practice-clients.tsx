'use client';

import Link from 'next/link';
import { useState } from 'react';

import { trpc } from '@kb/api-client';

export function PracticeClients() {
  const utils = trpc.useUtils();
  const q = trpc.cases.client.list.useQuery(undefined, { enabled: true });
  const create = trpc.cases.client.create.useMutation({
    onSuccess: async () => {
      await utils.cases.client.list.invalidate();
      setName('');
      setPhone('');
      setEmail('');
    },
  });

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  return (
    <div className="space-y-8" style={{ fontFamily: 'var(--font-body)' }}>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
          Clients
        </h1>
        <Link href="/app/practice" className="text-sm text-[#C2410C] hover:underline">
          Back
        </Link>
      </div>

      <section className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-[#1C1917]">Add client</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-[#44403C]">Name</span>
            <input
              className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-[#44403C]">Phone</span>
            <input
              className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-[#44403C]">Email</span>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
        </div>
        <button
          type="button"
          disabled={!name.trim() || create.isPending}
          onClick={() =>
            void create.mutateAsync({
              displayName: name.trim(),
              phone: phone.trim() || null,
              email: email.trim() || null,
            })
          }
          className="mt-3 rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9a3409] disabled:opacity-50"
        >
          Save client
        </button>
        {create.error ? <p className="mt-2 text-sm text-red-700">{create.error.message}</p> : null}
      </section>

      {q.isPending ? (
        <p className="text-sm text-[#57534E]">Loading…</p>
      ) : q.isError ? (
        <p className="text-sm text-red-700">{q.error.message}</p>
      ) : (
        <ul className="divide-y divide-[#E7E5E4] rounded-xl border border-[#E7E5E4] bg-white shadow-sm">
          {(q.data?.clients ?? []).map((c) => (
            <li key={c.id} className="px-4 py-3 text-sm">
              <span className="font-medium text-[#1C1917]">{c.displayName}</span>
              <span className="mt-1 block text-xs text-[#78716C]">
                {[c.phone, c.email].filter(Boolean).join(' · ') || 'No contact'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
