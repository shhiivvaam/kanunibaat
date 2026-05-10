'use client';

import Link from 'next/link';
import { useState } from 'react';

import { trpc } from '@jurisly/api-client';

export function QaDetail({ id }: { id: string }) {
  const q = trpc.qa.question.byId.useQuery({ id }, { enabled: Boolean(id) });
  const me = trpc.profile.me.useQuery(undefined, { staleTime: 60_000 });
  const canAnswer =
    (me.data?.roles.includes('lawyer') ?? false) &&
    me.data?.lawyer?.verificationStatus === 'verified';

  const utils = trpc.useUtils();
  const vote = trpc.qa.vote.set.useMutation({
    onSuccess: async () => {
      await utils.qa.question.byId.invalidate({ id });
      await utils.qa.question.list.invalidate();
    },
  });
  const ai = trpc.qa.question.aiPreview.useMutation({
    onSuccess: async () => {
      await utils.qa.question.byId.invalidate({ id });
    },
  });
  const answer = trpc.qa.answer.create.useMutation({
    onSuccess: async () => {
      setAnswerBody('');
      await utils.qa.question.byId.invalidate({ id });
      await utils.qa.question.list.invalidate();
    },
  });

  const [answerBody, setAnswerBody] = useState('');

  const row = q.data?.question;
  const answers = q.data?.answers ?? [];
  const votes = q.data?.votes ?? { up: 0, down: 0 };
  const aiPreview = row?.aiPreviewJson as null | {
    summary?: string;
    steps?: string[];
    disclaimer?: string;
  };

  return (
    <div className="space-y-8" style={{ fontFamily: 'var(--font-body)' }}>
      <div>
        <Link href="/legal-qa" className="text-sm text-[#C2410C] hover:underline">
          ← Legal Q&A
        </Link>
        <h1
          className="mt-2 text-2xl font-semibold text-[#1C1917]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {row?.title ?? 'Question'}
        </h1>
        <p className="mt-1 text-xs text-[#78716C]">{row?.category || 'general'}</p>
      </div>

      {q.isPending ? <p className="text-sm text-[#57534E]">Loading…</p> : null}
      {q.isError ? <p className="text-sm text-red-700">{q.error.message}</p> : null}

      {row ? (
        <section className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm space-y-3">
          <p className="whitespace-pre-wrap text-sm text-[#1C1917]">{row.body}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border border-[#E7E5E4] px-3 py-1 text-xs font-semibold text-[#44403C] hover:bg-[#FAFAF9]"
              onClick={() => void vote.mutateAsync({ questionId: row.id, value: 'up' })}
            >
              Upvote ({votes.up})
            </button>
            <button
              type="button"
              className="rounded-full border border-[#E7E5E4] px-3 py-1 text-xs font-semibold text-[#44403C] hover:bg-[#FAFAF9]"
              onClick={() => void vote.mutateAsync({ questionId: row.id, value: 'down' })}
            >
              Downvote ({votes.down})
            </button>
            <button
              type="button"
              className="rounded-full border border-[#E7E5E4] px-3 py-1 text-xs font-semibold text-[#44403C] hover:bg-[#FAFAF9]"
              onClick={() => void vote.mutateAsync({ questionId: row.id, value: null })}
            >
              Clear vote
            </button>
            <div className="flex-1" />
            <button
              type="button"
              className="rounded-full bg-[#C2410C] px-3 py-1 text-xs font-semibold text-white hover:bg-[#9a3409] disabled:opacity-60"
              disabled={ai.isPending}
              onClick={() => void ai.mutateAsync({ id: row.id, locale: 'en' })}
            >
              Generate AI preview
            </button>
          </div>
        </section>
      ) : null}

      {aiPreview ? (
        <section className="rounded-xl border border-[#FED7AA] bg-[#FFF7ED] p-4">
          <p className="text-xs font-semibold text-[#9A3412]">AI preview (general information)</p>
          <p className="mt-2 text-sm text-[#1C1917]">{aiPreview.summary}</p>
          {Array.isArray(aiPreview.steps) ? (
            <ul className="mt-2 list-disc pl-5 text-sm text-[#1C1917]">
              {aiPreview.steps.map((s: string, idx: number) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          ) : null}
          {aiPreview.disclaimer ? (
            <p className="mt-3 text-xs text-[#7C2D12]">{aiPreview.disclaimer}</p>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-[#1C1917]">Answers</h2>
        {answers.length === 0 ? <p className="text-sm text-[#78716C]">No answers yet.</p> : null}
        <div className="space-y-3">
          {answers.map((a) => (
            <div key={a.id} className="rounded-lg border border-[#F5F5F4] p-3">
              <p className="whitespace-pre-wrap text-sm text-[#1C1917]">{a.body}</p>
            </div>
          ))}
        </div>
      </section>

      {canAnswer ? (
        <section className="rounded-xl border border-[#E7E5E4] bg-white p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-[#1C1917]">
            Post an answer (verified lawyers)
          </h2>
          <textarea
            className="w-full rounded-lg border border-[#D6D3D1] px-3 py-2 text-sm"
            rows={6}
            value={answerBody}
            onChange={(e) => setAnswerBody(e.target.value)}
          />
          <button
            type="button"
            className="rounded-xl bg-[#15803d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#166534] disabled:opacity-60"
            disabled={answer.isPending || answerBody.trim().length < 20}
            onClick={() => void answer.mutateAsync({ questionId: id, body: answerBody.trim() })}
          >
            Submit answer
          </button>
          {answer.error ? <p className="text-sm text-red-700">{answer.error.message}</p> : null}
        </section>
      ) : null}
    </div>
  );
}
