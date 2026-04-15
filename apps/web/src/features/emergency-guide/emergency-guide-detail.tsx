'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { trpc } from '@kb/api-client';
import { INDIAN_STATES_AND_UTS } from '@kb/utils';

import { HotlinesBar } from './hotlines-bar';
import { urgencyBadgeClass, urgencyLabel } from './urgency-styles';

function Section({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[#78716C]" style={{ fontFamily: 'var(--font-display)' }}>
        {title}
      </h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[#292524]" style={{ fontFamily: 'var(--font-body)' }}>
        {items.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ol>
    </section>
  );
}

export function EmergencyGuideDetail({ slug }: { slug: string }) {
  const detail = trpc.emergencyGuide.bySlug.useQuery({ slug });
  const [stateCode, setStateCode] = useState('DL');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [formOpen, setFormOpen] = useState(true);

  const personalize = trpc.emergencyGuide.personalize.useMutation();

  const scenario = detail.data?.scenario;
  const guide = personalize.data?.guide;

  const lawyerHref = useMemo(() => {
    const hint = scenario?.lawyerSearchHint ?? 'lawyer';
    return `/lawyers?q=${encodeURIComponent(hint)}`;
  }, [scenario?.lawyerSearchHint]);

  const onPersonalize = () => {
    if (!scenario) return;
    personalize.mutate({ slug: scenario.slug, stateCode, answers });
  };

  if (detail.isPending) {
    return <p className="text-sm text-[#78716C]">Loading…</p>;
  }
  if (detail.isError) {
    return <p className="text-sm text-red-700">{detail.error.message}</p>;
  }
  if (!scenario) {
    return null;
  }

  return (
    <div className="space-y-8">
      <HotlinesBar />

      <header className="space-y-2">
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${urgencyBadgeClass(scenario.urgency)}`}>
          {urgencyLabel(scenario.urgency)}
        </span>
        <h1 className="text-3xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
          {scenario.titleEn}
        </h1>
        <p className="text-lg text-[#57534E]" style={{ fontFamily: 'var(--font-body)' }}>
          {scenario.titleHi}
        </p>
      </header>

      <button
        type="button"
        onClick={() => setFormOpen((o) => !o)}
        className="text-sm font-semibold text-[#C2410C] hover:underline"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {formOpen ? 'Hide' : 'Show'} personalisation (state + situation)
      </button>

      {formOpen ? (
        <div className="rounded-2xl border border-[#E7E5E4] bg-white p-5 shadow-sm">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[#1C1917]">Your state / UT</span>
            <select
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
              className="rounded-xl border border-[#E7E5E4] bg-white px-3 py-2 text-sm"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {INDIAN_STATES_AND_UTS.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-4 grid gap-4">
            {scenario.contextQuestions.map((q) => (
              <label key={q.id} className="grid gap-1">
                <span className="text-sm font-medium text-[#44403C]">{q.labelEn}</span>
                <span className="text-xs text-[#78716C]">{q.labelHi}</span>
                <textarea
                  value={answers[q.id] ?? ''}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  rows={2}
                  className="rounded-xl border border-[#E7E5E4] px-3 py-2 text-sm"
                  style={{ fontFamily: 'var(--font-body)' }}
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={onPersonalize}
            disabled={personalize.isPending}
            className="mt-4 rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9A3412] disabled:opacity-60"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {personalize.isPending ? 'Personalising…' : 'Personalise guide'}
          </button>
          {personalize.isError ? <p className="mt-2 text-sm text-red-700">{personalize.error.message}</p> : null}
        </div>
      ) : null}

      {personalize.data?.notice ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-950 ring-1 ring-amber-200">{personalize.data.notice}</p>
      ) : null}

      <div className="space-y-4">
        {guide ? (
          <>
            <Section title="Right now (next ~1 hour)" items={guide.right_now} />
            <Section title="Your rights (general)" items={guide.your_rights} />
            <Section title="Documents to gather" items={guide.documents} />
            <Section title="What not to do" items={guide.what_not_to_do} />
            <Section title="Police / court (general)" items={guide.police_or_court} />
            <Section title="Timeline (typical)" items={guide.timeline} />
            <Section title="Applicable laws (orientation)" items={guide.applicable_laws} />
          </>
        ) : (
          <>
            <Section title="Right now (next ~1 hour)" items={[...scenario.base.rightNow]} />
            <Section title="Your rights (general)" items={[...scenario.base.rights]} />
            <Section title="Documents to gather" items={[...scenario.base.documents]} />
            <Section title="What not to do" items={[...scenario.base.whatNotToDo]} />
            <Section title="Police / court (general)" items={[...scenario.base.policeOrCourt]} />
            <Section title="Timeline (typical)" items={[...scenario.base.timeline]} />
            <Section title="Applicable laws (orientation)" items={[...scenario.base.applicableLaws]} />
          </>
        )}
      </div>

      <p className="text-xs text-[#A8A29E]" style={{ fontFamily: 'var(--font-body)' }}>
        {detail.data?.disclaimer}
      </p>

      <Link
        href={lawyerHref}
        className="inline-flex w-full items-center justify-center rounded-2xl bg-[#C2410C] px-5 py-3 text-center text-sm font-semibold text-white hover:bg-[#9A3412] sm:w-auto"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        Talk to a relevant lawyer
      </Link>
    </div>
  );
}
