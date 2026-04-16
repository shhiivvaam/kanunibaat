'use client';

import Link from 'next/link';

import { trpc } from '@kb/api-client';

export function ResearchHub() {
  const profile = trpc.profile.me.useQuery();

  if (profile.isPending) {
    return <p className="text-sm text-[#57534E]">Loading…</p>;
  }
  if (!profile.data?.roles.includes('lawyer')) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        Legal research tools are for lawyers. Switch to a lawyer account or complete lawyer onboarding.
      </div>
    );
  }

  return (
    <div className="space-y-8" style={{ fontFamily: 'var(--font-body)' }}>
      <div>
        <h1 className="text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
          Research
        </h1>
        <p className="mt-2 text-sm text-[#57534E]">
          Judgment search (Meilisearch + Postgres fallback), law library, IPC/BNS crosswalk, and AI drafting helpers.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/app/research/judgments"
          className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm hover:bg-[#FAFAF9]"
        >
          <h2 className="font-semibold text-[#1C1917]">Judgments</h2>
          <p className="mt-1 text-sm text-[#57534E]">Search curated excerpts; optional NL query expansion.</p>
        </Link>
        <Link
          href="/app/research/library"
          className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm hover:bg-[#FAFAF9]"
        >
          <h2 className="font-semibold text-[#1C1917]">Law library</h2>
          <p className="mt-1 text-sm text-[#57534E]">Central Acts metadata and links to India Code.</p>
        </Link>
        <Link
          href="/app/research/mapper"
          className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm hover:bg-[#FAFAF9]"
        >
          <h2 className="font-semibold text-[#1C1917]">IPC → BNS / BNSS</h2>
          <p className="mt-1 text-sm text-[#57534E]">Illustrative crosswalk (verify against official tables).</p>
        </Link>
        <Link
          href="/app/research/drafting"
          className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm hover:bg-[#FAFAF9]"
        >
          <h2 className="font-semibold text-[#1C1917]">AI drafting</h2>
          <p className="mt-1 text-sm text-[#57534E]">Templates filled from structured facts (requires OpenAI on API).</p>
        </Link>
      </div>
    </div>
  );
}
