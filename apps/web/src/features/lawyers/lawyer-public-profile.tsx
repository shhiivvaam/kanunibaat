'use client';

import Link from 'next/link';

import { trpc } from '@jurisly/api-client';

export function LawyerPublicProfile({ slug }: { slug: string }) {
  const q = trpc.marketplace.lawyerBySlug.useQuery({ slug });

  if (q.isPending) {
    return <p className="text-sm text-[#78716C]">Loading profile…</p>;
  }
  if (q.isError) {
    return <p className="text-sm text-red-700">{q.error.message}</p>;
  }
  const law = q.data?.lawyer;
  if (!law) {
    return (
      <div className="rounded-2xl border border-[#E7E5E4] bg-white p-8 text-center shadow-sm">
        <p className="text-sm text-[#57534E]" style={{ fontFamily: 'var(--font-body)' }}>
          This lawyer profile is not available or is not verified yet.
        </p>
        <Link
          href="/lawyers"
          className="mt-4 inline-block text-sm font-semibold text-[#C2410C] hover:underline"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Back to directory
        </Link>
      </div>
    );
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-[#E7E5E4] bg-white shadow-sm">
      <div className="border-b border-[#E7E5E4] bg-[#FFF7ED] px-8 py-10">
        <h1
          className="text-3xl font-semibold text-[#1C1917]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {law.displayName ?? 'Verified lawyer'}
        </h1>
        {law.headline ? (
          <p className="mt-2 text-lg text-[#44403C]" style={{ fontFamily: 'var(--font-body)' }}>
            {law.headline}
          </p>
        ) : null}
        <dl
          className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-[#57534E]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {law.avgRating != null && law.reviewCount > 0 ? (
            <div>
              <dt className="font-semibold text-[#1C1917]">Client rating</dt>
              <dd>
                {law.avgRating.toFixed(1)} / 5 ({law.reviewCount} verified)
              </dd>
            </div>
          ) : null}
          {law.avgFirstReplyMinutes != null ? (
            <div>
              <dt className="font-semibold text-[#1C1917]">Typical first reply</dt>
              <dd>~{law.avgFirstReplyMinutes} min after session starts</dd>
            </div>
          ) : null}
          {law.city ? (
            <div>
              <dt className="font-semibold text-[#1C1917]">City</dt>
              <dd>{law.city}</dd>
            </div>
          ) : null}
          {law.barState ? (
            <div>
              <dt className="font-semibold text-[#1C1917]">Bar council</dt>
              <dd>{law.barState}</dd>
            </div>
          ) : null}
          {law.yearsExperience != null ? (
            <div>
              <dt className="font-semibold text-[#1C1917]">Experience</dt>
              <dd>{law.yearsExperience} years</dd>
            </div>
          ) : null}
        </dl>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/app/consultations/book?lawyerUserId=${encodeURIComponent(law.userId)}&slug=${encodeURIComponent(
              law.slug,
            )}`}
            className="inline-flex items-center justify-center rounded-xl bg-[#C2410C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#9A3412]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Book consultation
          </Link>
          <Link
            href="/app"
            className="inline-flex items-center justify-center rounded-xl border border-[#E7E5E4] bg-white px-4 py-2 text-sm font-semibold text-[#44403C] hover:bg-[#FAFAF9]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Go to dashboard
          </Link>
        </div>
      </div>
      <div className="space-y-6 px-8 py-10">
        {law.bio ? (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#78716C]">About</h2>
            <p
              className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#44403C]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {law.bio}
            </p>
          </section>
        ) : null}
        {law.practiceAreas.length > 0 ? (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#78716C]">
              Practice areas
            </h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {law.practiceAreas.map((a) => (
                <li
                  key={a}
                  className="rounded-full bg-[#FAFAF9] px-3 py-1 text-xs font-medium text-[#44403C] ring-1 ring-[#E7E5E4]"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {a}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {law.languages.length > 0 ? (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#78716C]">
              Languages
            </h2>
            <p className="mt-2 text-sm text-[#44403C]" style={{ fontFamily: 'var(--font-body)' }}>
              {law.languages.join(' · ')}
            </p>
          </section>
        ) : null}
        {law.recentReviews.length > 0 ? (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#78716C]">
              Recent reviews
            </h2>
            <ul className="mt-3 space-y-3">
              {law.recentReviews.map((r, idx) => (
                <li
                  key={`${idx}-${r.rating}-${r.reviewText?.slice(0, 12) ?? ''}`}
                  className="rounded-xl bg-[#FAFAF9] p-3 ring-1 ring-[#E7E5E4]"
                >
                  <p
                    className="text-sm font-semibold text-[#1C1917]"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {r.rating} / 5
                  </p>
                  {r.reviewText ? (
                    <p
                      className="mt-2 text-sm text-[#44403C]"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      {r.reviewText}
                    </p>
                  ) : null}
                  <p
                    className="mt-2 text-[11px] text-[#A8A29E]"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <p className="text-xs text-[#A8A29E]" style={{ fontFamily: 'var(--font-body)' }}>
          Jurisly verifies enrollment details before listing. This page is informational and does
          not constitute legal advice.
        </p>
        <Link
          href="/lawyers"
          className="inline-block text-sm font-semibold text-[#C2410C] hover:underline"
        >
          ← All lawyers
        </Link>
      </div>
    </article>
  );
}
