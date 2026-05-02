'use client';

import { Check, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const lawyerPlans = [
  {
    name: 'Vakil Basic',
    price: 499,
    period: '/month',
    tagline: 'Profile, discovery, and consultations',
    highlight: false,
    features: [
      'Verified lawyer profile + discovery',
      'Chat consultations',
      'Up to 10 active cases on platform',
      'Standard support',
    ],
  },
  {
    name: 'Vakil Pro',
    price: 1499,
    period: '/month',
    tagline: 'Full practice tooling',
    highlight: true,
    features: [
      'Everything in Basic',
      'AI legal research assistant',
      'Case management workspace',
      'Billing & invoicing basics',
      'Practice analytics',
    ],
  },
  {
    name: 'Vakil Premium',
    price: 2999,
    period: '/month',
    tagline: 'Scale and integrations',
    highlight: false,
    features: [
      'Everything in Pro',
      'API access (where available)',
      'White-label consultation flows',
      'Priority support',
    ],
  },
];

const smePlan = {
  name: 'SME Legal',
  price: 4999,
  period: '/month',
  description:
    'Business legal package — multiple seats, document workflows, and dedicated onboarding.',
};

const faqs = [
  {
    q: 'How does verification work?',
    a: 'You complete phone and email verification, submit Bar Council enrollment details and documents, and our team reviews within 48 hours (target SLA). Only then does the verified badge appear on your profile.',
  },
  {
    q: 'Is Jurisly trying to replace lawyers?',
    a: 'No. We build tools so you spend less time on admin and research and more on clients and courts. AI assists; you remain the professional giving advice.',
  },
  {
    q: 'When can I start?',
    a: 'We are onboarding advocates in batches. Join the lawyer waitlist for early access and founding-member benefits.',
  },
];

export function ForLawyersPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <section className="border-b border-[#E7E5E4] bg-gradient-to-b from-[#1C1917] to-[#292524] px-6 py-20 text-white">
        <div className="mx-auto max-w-[800px] text-center">
          <p
            className="mb-4 text-sm uppercase tracking-widest text-[#FDBA74]"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
          >
            For Vakils
          </p>
          <h1
            className="mb-5"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'clamp(32px, 5vw, 52px)',
              lineHeight: 1.1,
            }}
          >
            Grow your practice. Manage cases. Research in seconds.
          </h1>
          <p
            className="text-lg text-stone-300"
            style={{ fontFamily: 'var(--font-body)', lineHeight: 1.7 }}
          >
            Jurisly is the operating system for modern Indian advocates — client discovery,
            encrypted consults, case files, and AI that cites sources so you stay in control.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/waitlist/lawyer"
              className="inline-flex h-12 items-center rounded-[16px] bg-[#C2410C] px-8 text-sm font-semibold text-white transition-colors hover:bg-[#EA580C]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Join lawyer waitlist
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-12 items-center rounded-[16px] border border-stone-500 px-8 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              See all pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-6 py-16">
        <h2
          className="mb-4 text-center text-3xl text-[#1C1917]"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
        >
          Built for your workflow
        </h2>
        <p
          className="mx-auto mb-12 max-w-[640px] text-center text-[#78716C]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Public profile and trust signals, encrypted in-app chat and calls, document collaboration,
          and research that respects lawyer dignity — no race-to-the-bottom ratings.
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'Profile & verification',
              body: 'Bar Council-backed verification, practice areas, languages, fees, and availability — so the right clients find you.',
            },
            {
              title: 'Case management',
              body: 'Matter files, deadlines, notes, and client communication in one place — synced with consultation history.',
            },
            {
              title: 'AI research',
              body: 'Draft faster with grounded research prompts. You review every output before it goes to a client.',
            },
          ].map((card) => (
            <div key={card.title} className="rounded-[20px] border border-[#E7E5E4] bg-white p-6">
              <h3
                className="mb-2 text-lg font-semibold text-[#1C1917]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {card.title}
              </h3>
              <p
                className="text-sm text-[#57534E]"
                style={{ fontFamily: 'var(--font-body)', lineHeight: 1.65 }}
              >
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-[#E7E5E4] bg-white px-6 py-16">
        <div className="mx-auto max-w-[1100px]">
          <h2
            className="mb-10 text-center text-3xl text-[#1C1917]"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
          >
            Lawyer plans
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {lawyerPlans.map((plan) => (
              <div
                key={plan.name}
                className="flex flex-col rounded-[24px] border p-8"
                style={{
                  borderColor: plan.highlight ? '#C2410C' : '#E7E5E4',
                  borderWidth: plan.highlight ? 2 : 1,
                  background: plan.highlight ? '#FFF7ED' : '#FAFAF9',
                }}
              >
                {plan.highlight ? (
                  <span
                    className="mb-4 w-fit rounded-full px-3 py-1 text-xs font-bold text-white"
                    style={{ background: '#C2410C', fontFamily: 'var(--font-body)' }}
                  >
                    Popular
                  </span>
                ) : (
                  <span className="mb-4 h-6" aria-hidden />
                )}
                <h3
                  className="text-xl font-bold text-[#1C1917]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {plan.name}
                </h3>
                <p
                  className="mt-1 text-sm text-[#78716C]"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {plan.tagline}
                </p>
                <div className="my-6 flex items-baseline gap-1">
                  <span
                    className="text-4xl font-bold text-[#1C1917]"
                    style={{ fontFamily: 'var(--font-display)', lineHeight: 1 }}
                  >
                    ₹{plan.price}
                  </span>
                  <span
                    className="text-sm text-[#78716C]"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {plan.period}
                  </span>
                </div>
                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex gap-2 text-sm text-[#44403C]"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      <Check className="mt-0.5 shrink-0 text-[#15803D]" size={16} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/waitlist/lawyer"
                  className="flex h-11 items-center justify-center rounded-[14px] text-sm font-semibold transition-colors"
                  style={{
                    fontFamily: 'var(--font-body)',
                    background: plan.highlight ? '#C2410C' : '#1C1917',
                    color: 'white',
                  }}
                >
                  Request access
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[20px] border border-[#E7E5E4] bg-[#FAFAF9] p-8 md:flex md:items-center md:justify-between md:gap-8">
            <div>
              <h3
                className="text-xl font-bold text-[#1C1917]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {smePlan.name}
              </h3>
              <p
                className="mt-2 max-w-xl text-sm text-[#57534E]"
                style={{ fontFamily: 'var(--font-body)', lineHeight: 1.65 }}
              >
                {smePlan.description}
              </p>
            </div>
            <div className="mt-6 flex shrink-0 flex-col items-start gap-3 md:mt-0 md:items-end">
              <p
                className="text-3xl font-bold text-[#1C1917]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                ₹{smePlan.price}
                <span
                  className="text-base font-normal text-[#78716C]"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {smePlan.period}
                </span>
              </p>
              <Link
                href="/waitlist/lawyer"
                className="text-sm font-semibold text-[#C2410C] hover:underline"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Contact for SME →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[720px] px-6 py-16">
        <h2
          className="mb-8 text-center text-2xl text-[#1C1917]"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
        >
          FAQ for lawyers
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={faq.q}
              className="overflow-hidden rounded-[16px] border border-[#E7E5E4] bg-white"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-5 text-left"
              >
                <span
                  className="pr-4 text-[#1C1917]"
                  style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                >
                  {faq.q}
                </span>
                <ChevronDown
                  size={18}
                  className="shrink-0 text-[#78716C] transition-transform"
                  style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none' }}
                />
              </button>
              {openFaq === i ? (
                <div className="px-6 pb-5">
                  <p
                    className="text-sm leading-relaxed text-[#78716C]"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {faq.a}
                  </p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
