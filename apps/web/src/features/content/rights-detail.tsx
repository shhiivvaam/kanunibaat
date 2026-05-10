'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import { trpc } from '@jurisly/api-client';

export function RightsDetail({ slug }: { slug: string }) {
  const q = trpc.content.article.bySlug.useQuery({ slug }, { enabled: Boolean(slug) });
  const inc = trpc.content.article.incrementViews.useMutation();

  useEffect(() => {
    if (!slug) return;
    void inc.mutateAsync({ slug });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const a = q.data?.article;
  const title = a?.titleJson?.en ?? slug;
  const body = a?.bodyJson?.en ?? '';

  return (
    <div className="space-y-8" style={{ fontFamily: 'var(--font-body)' }}>
      <div>
        <Link href="/rights" className="text-sm text-[#C2410C] hover:underline">
          ← Rights library
        </Link>
        <h1
          className="mt-2 text-2xl font-semibold text-[#1C1917]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {title}
        </h1>
        <p className="mt-1 text-xs text-[#78716C]">{a?.category ?? 'general'}</p>
      </div>

      {q.isPending ? <p className="text-sm text-[#57534E]">Loading…</p> : null}
      {q.isError ? <p className="text-sm text-red-700">{q.error.message}</p> : null}

      {a ? (
        <article className="rounded-xl border border-[#E7E5E4] bg-white p-5 shadow-sm">
          <p className="whitespace-pre-wrap text-sm leading-7 text-[#1C1917]">{body}</p>
        </article>
      ) : null}
    </div>
  );
}
