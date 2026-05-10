'use client';

import Link from 'next/link';
import { useState } from 'react';

import { trpc } from '@jurisly/api-client';

const TEMPLATES = [
  { value: 'legal_notice_reply' as const, label: 'Reply to legal notice' },
  { value: 'bail_application_outline' as const, label: 'Bail application outline' },
  { value: 'written_statement_outline' as const, label: 'Written statement outline' },
];

export function ResearchDrafting() {
  const fill = trpc.research.drafting.fillTemplate.useMutation();
  const [templateKey, setTemplateKey] =
    useState<(typeof TEMPLATES)[number]['value']>('legal_notice_reply');
  const [factsRaw, setFactsRaw] = useState('{"clientName":"[Name]","dispute":"[Brief facts]"}');

  return (
    <div className="space-y-6" style={{ fontFamily: 'var(--font-body)' }}>
      <Link href="/app/research" className="text-sm text-[#C2410C] hover:underline">
        ← Research home
      </Link>
      <h1
        className="text-xl font-semibold text-[#1C1917]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        AI drafting
      </h1>
      <p className="text-xs text-[#78716C]">
        Requires OPENAI_API_KEY on the API. Output is a first draft for lawyer review only.
      </p>
      <label className="block text-sm">
        <span className="text-[#44403C]">Template</span>
        <select
          className="mt-1 w-full max-w-md rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
          value={templateKey}
          onChange={(e) => setTemplateKey(e.target.value as (typeof TEMPLATES)[number]['value'])}
        >
          {TEMPLATES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="text-[#44403C]">Facts (JSON object)</span>
        <textarea
          className="mt-1 w-full max-w-2xl rounded-lg border border-[#D6D3D1] px-3 py-2 font-mono text-xs"
          rows={8}
          value={factsRaw}
          onChange={(e) => setFactsRaw(e.target.value)}
        />
      </label>
      <button
        type="button"
        className="rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        disabled={fill.isPending}
        onClick={() => {
          try {
            const facts = JSON.parse(factsRaw) as Record<string, string>;
            if (typeof facts !== 'object' || facts === null || Array.isArray(facts)) {
              throw new Error('Facts must be a JSON object with string values.');
            }
            void fill.mutateAsync({ templateKey, facts });
          } catch (e) {
            window.alert(e instanceof Error ? e.message : 'Invalid JSON');
          }
        }}
      >
        Generate draft
      </button>
      {fill.error ? <p className="text-sm text-red-700">{fill.error.message}</p> : null}
      {fill.data ? (
        <div className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[#1C1917]">{fill.data.draft.title}</h2>
          <div className="mt-3 max-w-none whitespace-pre-wrap text-sm leading-relaxed text-[#44403C]">
            {fill.data.draft.body}
          </div>
          {fill.data.draft.checklist?.length ? (
            <ul className="mt-3 list-disc pl-5 text-sm text-[#57534E]">
              {fill.data.draft.checklist.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
