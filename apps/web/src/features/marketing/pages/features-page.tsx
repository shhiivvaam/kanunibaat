'use client';

import { BookOpen, Brain, FolderLock, Gavel, Scale, ScanLine, Users } from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: ScanLine,
    title: 'Notice Scanner',
    summary:
      'Upload a photo or PDF of any legal notice — get plain-language summary, deadlines, and next steps.',
    details: [
      'OCR + AI identifies notice type (summons, demand letter, eviction, tax, and more).',
      'Flags deadlines and amounts so you do not miss critical dates.',
      'Shareable summary card — spread awareness without sharing raw documents.',
    ],
  },
  {
    icon: Brain,
    title: 'Emergency Legal Guide (“Kya Karein?”)',
    summary:
      'Step-by-step guidance for stressful situations — what to do in the first hour, your rights, and when to call a lawyer.',
    details: [
      'Curated scenarios reviewed by lawyers, personalised by AI for your state and facts.',
      'Clear “do / don’t” lists and document checklists.',
      'One-tap path to a matched advocate when you need human advice.',
    ],
  },
  {
    icon: Users,
    title: 'Lawyer Marketplace',
    summary:
      'Find verified advocates by practice area, language, location, and fee — book chat, audio, or video consults.',
    details: [
      'Bar Council verification and ongoing quality checks — no anonymous listings.',
      'Transparent fees and consultation modes; you choose what works.',
      'AI-assisted matching based on your issue — lawyers stay in control of advice.',
    ],
  },
  {
    icon: FolderLock,
    title: 'Document Vault',
    summary:
      'Private, encrypted storage for contracts, notices, and evidence — organised and searchable.',
    details: [
      'Designed for DPDP-aligned handling; you control what is stored.',
      'Share securely with your lawyer when you start a consultation.',
      'Coming soon: version history and expiry reminders for key documents.',
    ],
  },
  {
    icon: BookOpen,
    title: 'Know Your Rights & Legal Library',
    summary:
      'Plain-language explainers on consumer, property, employment, family law, and more — in Hindi and English first.',
    details: [
      'Structured by life situations, not statute numbers.',
      'Always linked to “talk to a lawyer” when the situation is unique or high-stakes.',
    ],
  },
  {
    icon: Gavel,
    title: 'Case Tracker (Pro)',
    summary:
      'Follow hearing dates, filings, and tasks — built for busy individuals, not just enterprises.',
    details: [
      'Reminders and a simple timeline view.',
      'Optional sharing with your retained lawyer for the same case.',
    ],
  },
  {
    icon: Scale,
    title: 'For Vakils: Practice Suite',
    summary: 'Case management, AI research, billing, and client discovery — in one workspace.',
    details: [
      'Reduce admin; focus on arguments and clients.',
      'See our dedicated pitch and pricing on the For Lawyers page.',
    ],
    cta: { label: 'For Lawyers', href: '/for-lawyers' },
  },
];

export function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <section className="border-b border-[#E7E5E4] bg-[#FFF7ED] px-6 py-20">
        <div className="mx-auto max-w-[800px] text-center">
          <p
            className="mb-4 text-sm uppercase tracking-widest text-[#C2410C]"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
          >
            Product
          </p>
          <h1
            className="mb-5 text-[#1C1917]"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'clamp(32px, 5vw, 52px)',
              lineHeight: 1.1,
            }}
          >
            Everything you need to navigate Indian law — calmly.
          </h1>
          <p
            className="text-lg text-[#78716C]"
            style={{ fontFamily: 'var(--font-body)', lineHeight: 1.7 }}
          >
            Jurisly combines AI-powered information with verified lawyers. We guide; advocates
            decide. Nothing here replaces professional legal advice.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[960px] px-6 py-16">
        <div className="space-y-16">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <article
                key={f.title}
                className="rounded-[24px] border border-[#E7E5E4] bg-white p-8 md:flex md:gap-10 md:p-10"
              >
                <div className="mb-6 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#FFF7ED] text-[#C2410C] md:mb-0">
                  <Icon size={28} strokeWidth={1.75} />
                </div>
                <div className="flex-1">
                  <h2
                    className="mb-3 text-2xl text-[#1C1917]"
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
                  >
                    {f.title}
                  </h2>
                  <p
                    className="mb-5 text-[#44403C]"
                    style={{ fontFamily: 'var(--font-body)', lineHeight: 1.7 }}
                  >
                    {f.summary}
                  </p>
                  <ul className="space-y-2">
                    {f.details.map((d) => (
                      <li
                        key={d}
                        className="flex gap-2 text-sm text-[#57534E]"
                        style={{ fontFamily: 'var(--font-body)', lineHeight: 1.6 }}
                      >
                        <span
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C2410C]"
                          aria-hidden
                        />
                        {d}
                      </li>
                    ))}
                  </ul>
                  {'cta' in f && f.cta ? (
                    <Link
                      href={f.cta.href}
                      className="mt-6 inline-block text-sm font-semibold text-[#C2410C] hover:underline"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      {f.cta.label} →
                    </Link>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-20 rounded-[24px] border border-[#FED7AA] bg-[#FFF7ED] p-10 text-center">
          <h3
            className="mb-3 text-xl text-[#1C1917]"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
          >
            Ready to see pricing?
          </h3>
          <p
            className="mx-auto mb-6 max-w-md text-[#78716C]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Transparent plans for citizens and dedicated tiers for advocates.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/pricing"
              className="inline-flex h-12 items-center rounded-[16px] bg-[#C2410C] px-8 text-sm font-semibold text-white transition-colors hover:bg-[#9a3409]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              View pricing
            </Link>
            <Link
              href="/waitlist"
              className="inline-flex h-12 items-center rounded-[16px] border border-[#C2410C] bg-white px-8 text-sm font-semibold text-[#C2410C] transition-colors hover:bg-white/80"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Join the waitlist
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
