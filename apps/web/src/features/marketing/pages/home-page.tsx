'use client';

import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  FileText,
  Globe2,
  MessageSquare,
  Star,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const homeFaqs = [
  {
    q: 'Is my data safe?',
    a: 'We design for the Digital Personal Data Protection Act: minimal collection, encryption in transit, and clear retention rules. Read our Privacy Policy and Privacy Charter for details.',
  },
  {
    q: 'Are the lawyers on Jurisly real and verified?',
    a: 'Yes. Advocates go through Bar Council enrollment checks and manual review before they receive a verified badge. We do not list anonymous or unverified “experts”.',
  },
  {
    q: 'Is Jurisly giving me legal advice?',
    a: 'No. AI and articles provide general information. For your specific matter you should consult a qualified lawyer — we help you find one.',
  },
  {
    q: 'What languages do you support?',
    a: 'The marketing site and product are rolling out in English and Hindi first, with more Indian languages on the roadmap.',
  },
  {
    q: 'How much does it cost?',
    a: 'Naagrik Free stays free. Naagrik Pro and advocate plans are listed on our Pricing page — no hidden fees.',
  },
  {
    q: 'Can I use this in an emergency?',
    a: 'For police detention, violence, or immediate danger, call emergency services and a lawyer. Jurisly guides education and next steps — it is not a substitute for emergency response.',
  },
  {
    q: 'What if the AI makes a mistake?',
    a: 'Always cross-check important steps. If something looks wrong, stop and speak to an advocate. We continuously improve safety and citations.',
  },
  {
    q: 'How do I delete my account or data?',
    a: 'Once accounts are live, you can request deletion from settings or email privacy@tryjurisly.com. We respond under DPDP timelines.',
  },
] as const;

const testimonials = [
  {
    id: 1,
    name: 'Priya Venkataraman',
    city: 'Chennai',
    initial: 'P',
    color: '#C2410C',
    quote:
      'I was dealing with a wrongful eviction. Jurisly explained the Rent Control Act to me in Tamil Nadu context — clearly, without jargon. I knew exactly what to do next.',
    rating: 5,
  },
  {
    id: 2,
    name: 'Arjun Mehta',
    city: 'Ahmedabad',
    initial: 'A',
    color: '#1D4ED8',
    quote:
      'My employer was withholding my gratuity. Within minutes, I had a clear answer citing the Payment of Gratuity Act. I sent a legal notice the next day and got paid within a week.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Sunita Devi',
    city: 'Lucknow',
    initial: 'S',
    color: '#15803D',
    quote:
      'Mujhe Hindi mein samajh aaya ki consumer court mein case kaise file karein. Bahut helpful raha. Pehle kabhi aisa platform nahi tha common log ke liye.',
    rating: 5,
  },
];

const problems = [
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10" aria-hidden>
        <circle cx="24" cy="24" r="22" fill="#FFF7ED" />
        <path
          d="M24 12v12l8 4"
          stroke="#C2410C"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="24" cy="24" r="12" stroke="#C2410C" strokeWidth="2.5" />
      </svg>
    ),
    problem: 'Too Expensive',
    detail:
      'A single lawyer consultation costs ₹2,000–₹10,000 per hour. Most Indians simply cannot afford it.',
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10" aria-hidden>
        <circle cx="24" cy="24" r="22" fill="#FFF7ED" />
        <path
          d="M16 20h16M16 24h10M16 28h13"
          stroke="#C2410C"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M12 14h24a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V16a2 2 0 0 1 2-2z"
          stroke="#C2410C"
          strokeWidth="2.5"
        />
      </svg>
    ),
    problem: 'Too Confusing',
    detail:
      'Legal documents are filled with Latin phrases and archaic language that even educated citizens struggle to understand.',
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10" aria-hidden>
        <circle cx="24" cy="24" r="22" fill="#FFF7ED" />
        <path
          d="M24 16C19.6 16 16 19.6 16 24s3.6 8 8 8 8-3.6 8-8"
          stroke="#C2410C"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M30 16l4-4M34 12l-4 4 4 4"
          stroke="#C2410C"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M20 36c-4 0-8-2-8-6" stroke="#C2410C" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
    problem: 'Too Inaccessible',
    detail:
      'Most lawyers practice in metros. Rural India, with 65% of the population, has almost no access to quality legal help.',
  },
];

const services = [
  {
    icon: <MessageSquare size={24} />,
    name: 'Legal Q&A',
    desc: 'Ask any legal question and get clear, plain-language answers citing relevant Indian laws.',
    href: '/legal-qa',
  },
  {
    icon: <FileText size={24} />,
    name: 'Document Review',
    desc: 'Upload contracts, notices, or agreements and get a plain-language summary with red flags highlighted.',
    href: '/document-review',
  },
  {
    icon: <Users size={24} />,
    name: 'Lawyer Connect',
    desc: 'Find verified lawyers by specialization, city, language, and budget. Book consultations directly.',
    href: '/lawyer-connect',
  },
  {
    icon: <BookOpen size={24} />,
    name: 'Know Your Rights',
    desc: 'Understand your rights as a worker, tenant, consumer, woman, or digital citizen — in plain language.',
    href: '/know-your-rights',
  },
];

export function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="w-full">
      <section className="w-full bg-[#FFF7ED] py-20 lg:py-28">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
            <div className="flex-1 text-center lg:text-left">
              <div
                className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#FED7AA] px-3 py-1.5 text-xs text-[#C2410C]"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 600, letterSpacing: '0.05em' }}
              >
                <Zap size={12} />
                Now available in Hindi & English
              </div>

              <h1
                className="mb-5 text-[#1C1917]"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 'clamp(40px, 6vw, 64px)',
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                }}
              >
                Legal help. <span className="text-[#C2410C]">In plain language.</span> Right now.
              </h1>

              <p
                className="mx-auto mb-8 max-w-xl text-[#78716C] lg:mx-0"
                style={{ fontFamily: 'var(--font-body)', fontSize: '18px', lineHeight: 1.7 }}
              >
                Jurisly makes Indian law understandable for everyone. Ask questions, review
                documents, and connect with lawyers — starting at ₹0.
              </p>

              <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <Link
                  href="/waitlist"
                  className="flex h-12 items-center justify-center gap-2 rounded-[16px] bg-[#C2410C] px-7 text-white transition-all duration-100 hover:bg-[#9a3409] active:scale-[0.97]"
                  style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '15px' }}
                >
                  Join app waitlist <ArrowRight size={16} />
                </Link>
                <Link
                  href="/legal-qa"
                  className="flex h-12 items-center justify-center gap-2 rounded-[16px] border border-[#1C1917] text-[#1C1917] transition-all duration-150 hover:bg-[#1C1917] hover:text-white"
                  style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '15px' }}
                >
                  Ask a question
                </Link>
              </div>

              <div
                className="mt-8 rounded-[14px] border border-[#E7E5E4] bg-[#FAFAF9] px-4 py-3 text-center text-xs text-[#57534E] sm:text-left lg:text-left"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 500, lineHeight: 1.5 }}
              >
                <span className="text-[#1C1917]">40M+ pending cases in India</span>
                <span className="mx-2 hidden text-[#D6D3D1] sm:inline" aria-hidden>
                  |
                </span>
                <span className="mt-1 block sm:mt-0 sm:inline">1.7M+ registered lawyers</span>
                <span className="mx-2 hidden text-[#D6D3D1] sm:inline" aria-hidden>
                  |
                </span>
                <span className="mt-1 block text-[#C2410C] sm:mt-0 sm:inline">
                  Your legal partner is here
                </span>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 lg:justify-start">
                {[
                  { icon: <Globe2 size={14} />, text: 'Hindi & English' },
                  { icon: <Users size={14} />, text: 'Early users joining weekly' },
                  { icon: <Zap size={14} />, text: 'Starting at ₹0' },
                ].map((item) => (
                  <div
                    key={item.text}
                    className="flex items-center gap-1.5 text-[#78716C]"
                    style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 500 }}
                  >
                    <span className="text-[#C2410C]">{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full max-w-sm shrink-0 lg:max-w-[360px]">
              <div
                className="overflow-hidden rounded-[24px] border border-[#E7E5E4] bg-white shadow-xl"
                style={{ boxShadow: '0 24px 64px rgba(194,65,12,0.12)' }}
              >
                <div className="flex items-center gap-2 border-b border-[#E7E5E4] bg-[#FAFAF9] px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-[#FED7AA]" />
                    <div className="h-3 w-3 rounded-full bg-[#FED7AA]" />
                    <div className="h-3 w-3 rounded-full bg-[#FED7AA]" />
                  </div>
                  <div className="mx-3 flex h-6 flex-1 items-center rounded-lg bg-[#E7E5E4]/60 px-3">
                    <span className="text-[10px] text-[#78716C]">tryjurisly.com/legal-qa</span>
                  </div>
                </div>

                <div className="min-h-[280px] space-y-3 p-4">
                  <div className="flex justify-end">
                    <div
                      className="max-w-[85%] rounded-[16px] rounded-tr-sm bg-[#C2410C] px-4 py-3 text-sm leading-relaxed text-white"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      My landlord is refusing to return my security deposit after I moved out 2
                      months ago.
                    </div>
                  </div>

                  <div className="flex justify-start gap-2">
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#FED7AA] bg-[#FFF7ED]">
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '12px',
                          color: '#C2410C',
                          fontWeight: 700,
                        }}
                      >
                        K
                      </span>
                    </div>
                    <div className="max-w-[85%] rounded-[16px] rounded-tl-sm bg-[#F5F5F4] px-4 py-3">
                      <p
                        className="mb-2 text-sm leading-relaxed text-[#1C1917]"
                        style={{ fontFamily: 'var(--font-body)' }}
                      >
                        Under the <strong>Transfer of Property Act</strong>, your landlord must
                        return the deposit within 30 days of vacating. Since it&apos;s been 2
                        months, you can:
                      </p>
                      <ul className="space-y-1">
                        {[
                          'Send a legal notice via registered post',
                          'File in Consumer Forum (free under ₹5L)',
                          'Approach Rent Authority in your city',
                        ].map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-1.5 text-xs text-[#1C1917]"
                            style={{ fontFamily: 'var(--font-body)' }}
                          >
                            <Check size={11} className="mt-0.5 shrink-0 text-[#15803D]" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-center justify-start gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#FED7AA] bg-[#FFF7ED]">
                      <span
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '12px',
                          color: '#C2410C',
                          fontWeight: 700,
                        }}
                      >
                        K
                      </span>
                    </div>
                    <div className="flex gap-1.5 rounded-[16px] rounded-tl-sm bg-[#F5F5F4] px-4 py-3">
                      {[0, 0.15, 0.3].map((delay, i) => (
                        <div
                          key={i}
                          className="h-2 w-2 rounded-full bg-[#78716C]"
                          style={{ animation: `kb-bounce 1s ${delay}s infinite` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 border-t border-[#E7E5E4] p-3">
                  <input
                    type="text"
                    placeholder="Ask a legal question…"
                    readOnly
                    className="h-10 flex-1 rounded-xl border border-[#E7E5E4] bg-[#FAFAF9] px-3 text-xs text-[#78716C] outline-none placeholder:text-[#78716C]"
                    style={{ fontFamily: 'var(--font-body)' }}
                  />
                  <button
                    type="button"
                    className="flex h-10 items-center rounded-xl bg-[#C2410C] px-3 text-white"
                    aria-label="Send"
                  >
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-white py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mb-14 text-center">
            <p
              className="mb-3 text-sm uppercase tracking-widest text-[#C2410C]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
            >
              The Problem
            </p>
            <h2
              className="text-[#1C1917]"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 'clamp(28px, 4vw, 42px)',
                lineHeight: 1.2,
              }}
            >
              Legal help in India is broken.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {problems.map((p) => (
              <div key={p.problem} className="flex flex-col items-start">
                <div className="mb-5">{p.icon}</div>
                <h3
                  className="mb-2 text-[#1C1917]"
                  style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '22px' }}
                >
                  {p.problem}
                </h3>
                <p
                  className="leading-relaxed text-[#78716C]"
                  style={{ fontFamily: 'var(--font-body)', fontSize: '15px' }}
                >
                  {p.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="w-full bg-[#FAFAF9] py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mb-14 text-center">
            <p
              className="mb-3 text-sm uppercase tracking-widest text-[#C2410C]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
            >
              How It Works
            </p>
            <h2
              className="text-[#1C1917]"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 'clamp(28px, 4vw, 42px)',
                lineHeight: 1.2,
              }}
            >
              Three steps to clarity.
            </h2>
          </div>

          <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="absolute left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] top-8 hidden h-px border-t border-dashed border-[#E7E5E4] md:block" />

            {[
              {
                num: '01',
                title: 'Ask your question',
                desc: 'Type your legal situation in plain language. Hindi or English — your choice. No legal knowledge required.',
              },
              {
                num: '02',
                title: 'Get clear answers',
                desc: 'Our AI explains the relevant law in simple terms, citing specific Indian acts and sections that apply to your case.',
              },
              {
                num: '03',
                title: 'Act with confidence',
                desc: 'Need personal advice? Book a consultation with a verified lawyer directly through Jurisly.',
              },
            ].map((step) => (
              <div key={step.num} className="flex flex-col items-start">
                <div
                  className="relative z-10 mb-4"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: '56px',
                    color: '#FED7AA',
                    lineHeight: 1,
                  }}
                >
                  {step.num}
                </div>
                <h3
                  className="mb-2 text-[#1C1917]"
                  style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '20px' }}
                >
                  {step.title}
                </h3>
                <p
                  className="leading-relaxed text-[#78716C]"
                  style={{ fontFamily: 'var(--font-body)', fontSize: '15px' }}
                >
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/waitlist"
              className="inline-flex items-center gap-2 text-[#C2410C] transition-all hover:gap-3"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '15px' }}
            >
              Join the waitlist <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="w-full bg-white py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mb-14 text-center">
            <p
              className="mb-3 text-sm uppercase tracking-widest text-[#C2410C]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
            >
              Our Services
            </p>
            <h2
              className="text-[#1C1917]"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 'clamp(28px, 4vw, 42px)',
                lineHeight: 1.2,
              }}
            >
              Everything you need, legally.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {services.map((s) => (
              <Link
                key={s.name}
                href={s.href}
                className="group flex flex-col gap-4 rounded-[20px] border border-[#E7E5E4] bg-white p-8 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(0,0,0,0.07)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-[#FFF7ED] text-[#C2410C] transition-all duration-150 group-hover:bg-[#C2410C] group-hover:text-white">
                  {s.icon}
                </div>
                <div>
                  <h3
                    className="mb-1.5 text-[#1C1917]"
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '20px' }}
                  >
                    {s.name}
                  </h3>
                  <p
                    className="leading-relaxed text-[#78716C]"
                    style={{ fontFamily: 'var(--font-body)', fontSize: '15px' }}
                  >
                    {s.desc}
                  </p>
                </div>
                <div
                  className="mt-auto flex items-center gap-1 pt-2 text-sm text-[#C2410C] transition-all group-hover:gap-2"
                  style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                >
                  Learn more <ArrowRight size={14} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-[#FAFAF9] py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mb-4 text-center">
            <div className="mb-3 flex items-center justify-center gap-1">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Star key={i} size={16} fill="#C2410C" color="#C2410C" />
                ))}
              <span
                className="ml-2 text-sm text-[#78716C]"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
              >
                4.8/5 from 800+ reviews
              </span>
            </div>
            <h2
              className="text-[#1C1917]"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 'clamp(28px, 4vw, 42px)',
                lineHeight: 1.2,
              }}
            >
              Real people. Real results.
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="flex flex-col gap-4 rounded-[20px] border border-[#E7E5E4] bg-white p-6"
              >
                <div className="flex items-center gap-1">
                  {Array(t.rating)
                    .fill(0)
                    .map((_, i) => (
                      <Star key={i} size={12} fill="#C2410C" color="#C2410C" />
                    ))}
                </div>
                <p
                  className="flex-1 leading-relaxed text-[#1C1917]"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    fontSize: '16px',
                    lineHeight: 1.7,
                  }}
                >
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 border-t border-[#E7E5E4] pt-2">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white"
                    style={{
                      background: t.color,
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: '16px',
                    }}
                  >
                    {t.initial}
                  </div>
                  <div>
                    <p
                      className="text-sm text-[#1C1917]"
                      style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                    >
                      {t.name}
                    </p>
                    <p
                      className="text-xs text-[#78716C]"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      {t.city}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-white py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mb-14 text-center">
            <p
              className="mb-3 text-sm uppercase tracking-widest text-[#C2410C]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
            >
              Simple Pricing
            </p>
            <h2
              className="text-[#1C1917]"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 'clamp(28px, 4vw, 42px)',
                lineHeight: 1.2,
              }}
            >
              Start free. Upgrade when ready.
            </h2>
          </div>

          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-[24px] border border-[#E7E5E4] bg-white p-8">
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '22px',
                  color: '#1C1917',
                }}
              >
                Naagrik Free
              </h3>
              <p
                className="mb-6 mt-1 text-sm text-[#78716C]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Notice scans, guides, and discovery
              </p>
              <div className="mb-8 flex items-baseline gap-1">
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: '40px',
                    color: '#1C1917',
                  }}
                >
                  ₹0
                </span>
                <span className="text-sm text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
                  /forever
                </span>
              </div>
              <ul className="mb-8 space-y-3">
                {[
                  'Notice scanner (2 / month)',
                  'Emergency guide + Know Your Rights',
                  'Basic lawyer search',
                  'Vault for up to 5 documents',
                ].map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2.5 text-sm text-[#1C1917]"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    <Check size={14} className="shrink-0 text-[#15803D]" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/waitlist"
                className="flex h-11 w-full items-center justify-center rounded-[16px] border border-[#1C1917] text-sm text-[#1C1917] transition-all duration-150 hover:bg-[#1C1917] hover:text-white active:scale-[0.97]"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
              >
                Join waitlist
              </Link>
            </div>

            <div className="relative rounded-[24px] border border-[#C2410C] bg-[#FFF7ED] p-8">
              <div
                className="absolute right-4 top-4 rounded-full bg-[#C2410C] px-3 py-1 text-xs text-white"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
              >
                Most Popular
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '22px',
                  color: '#1C1917',
                }}
              >
                Naagrik Pro
              </h3>
              <p
                className="mb-6 mt-1 text-sm text-[#78716C]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Unlimited scans & priority matching
              </p>
              <div className="mb-8 flex items-baseline gap-1">
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: '40px',
                    color: '#C2410C',
                  }}
                >
                  ₹199
                </span>
                <span className="text-sm text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
                  /month
                </span>
              </div>
              <ul className="mb-8 space-y-3">
                {[
                  'Unlimited notice scans',
                  'Priority lawyer matching',
                  'Larger document vault (~5 GB)',
                  'Case tracker + AI insights',
                  'Hindi & English support',
                ].map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2.5 text-sm text-[#1C1917]"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    <Check size={14} className="shrink-0 text-[#C2410C]" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/waitlist"
                className="flex h-11 w-full items-center justify-center rounded-[16px] bg-[#C2410C] text-sm text-white transition-all duration-150 hover:bg-[#9a3409] active:scale-[0.97]"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
              >
                Join waitlist for Pro →
              </Link>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/pricing"
              className="text-sm text-[#78716C] transition-colors hover:text-[#C2410C]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              See Naagrik Plus & Vakil plans →
            </Link>
          </div>
        </div>
      </section>

      <section className="w-full bg-[#FAFAF9] py-20">
        <div className="mx-auto max-w-[720px] px-6">
          <h2
            className="mb-10 text-center text-[#1C1917]"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'clamp(28px, 4vw, 42px)',
              lineHeight: 1.2,
            }}
          >
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {homeFaqs.map((faq, i) => (
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
                    className="shrink-0 text-[#78716C] transition-transform duration-200"
                    style={{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>
                {openFaq === i ? (
                  <div
                    className="px-6 pb-5"
                    style={{ animation: 'kb-marketing-panel-reveal 250ms ease-out' }}
                  >
                    <p
                      className="leading-relaxed text-[#78716C]"
                      style={{ fontFamily: 'var(--font-body)', fontSize: '15px' }}
                    >
                      {faq.a}
                    </p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-[#C2410C] py-16">
        <div className="mx-auto max-w-[1200px] px-6 text-center">
          <h2
            className="mb-4 text-white"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'clamp(28px, 4vw, 42px)',
              lineHeight: 1.2,
            }}
          >
            Your rights matter. Know them.
          </h2>
          <p
            className="mx-auto mb-8 max-w-xl text-[#FED7AA]"
            style={{ fontFamily: 'var(--font-body)', fontSize: '17px', lineHeight: 1.6 }}
          >
            Join 2,000+ citizens who already use Jurisly to navigate Indian law with confidence.
          </p>
          <Link
            href="/waitlist"
            className="inline-flex h-12 items-center gap-2 rounded-[16px] bg-white px-8 text-sm text-[#C2410C] transition-all duration-150 hover:bg-[#FFF7ED] active:scale-[0.97]"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}
          >
            Join the waitlist <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <style>{`
        @keyframes kb-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
