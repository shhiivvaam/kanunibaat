'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { trpc } from '@kb/api-client';

export function QaAsk() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);

  const create = trpc.qa.question.create.useMutation();

  async function onSubmit() {
    const r = await create.mutateAsync({
      title: title.trim(),
      body: body.trim(),
      category: category.trim(),
      isAnonymous,
    });
    if (r.question?.id) router.push(`/legal-qa/${r.question.id}`);
  }

  return (
    <div className="space-y-8" style={{ fontFamily: 'var(--font-body)' }}>
      <div>
        <Link href="/legal-qa" className="text-sm text-[#C2410C] hover:underline">
          ← Legal Q&A
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
          Ask a question
        </h1>
      </div>

      <section className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm space-y-3">
        <label className="block text-sm">
          <span className="text-[#44403C]">Title</span>
          <input className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="text-[#44403C]">Details</span>
          <textarea className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm" rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="text-[#44403C]">Category (optional)</span>
          <input className="mt-1 w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm" value={category} onChange={(e) => setCategory(e.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-sm text-[#44403C]">
          <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
          Post anonymously (recommended)\n        </label>

        <button
          type="button"
          className="rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9a3409] disabled:opacity-60"
          disabled={create.isPending || title.trim().length < 10 || body.trim().length < 20}
          onClick={() => void onSubmit()}
        >
          Post question
        </button>
        {create.error ? <p className="text-sm text-red-700">{create.error.message}</p> : null}
      </section>
    </div>
  );
}

