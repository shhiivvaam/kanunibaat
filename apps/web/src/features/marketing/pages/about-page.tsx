'use client';

import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

import { useOpenAuth } from '@/features/marketing/open-auth-context';

const team = [
  {
    name: 'Anika Sharma',
    role: 'Co-founder & CEO',
    city: 'Delhi',
    bio: 'Former public interest lawyer at Delhi High Court. Spent 8 years in legal aid for marginalised communities.',
    avatar:
      'https://images.unsplash.com/photo-1659353219808-39d96fb9dc91?w=200&h=200&fit=crop&auto=format',
  },
  {
    name: 'Rahul Desai',
    role: 'Co-founder & CTO',
    city: 'Bengaluru',
    bio: 'Previously built fintech products at Razorpay. Passionate about using AI to solve access-to-justice problems.',
    avatar:
      'https://images.unsplash.com/photo-1649433658557-54cf58577c68?w=200&h=200&fit=crop&auto=format',
  },
  {
    name: 'Meera Iyer',
    role: 'Head of Legal',
    city: 'Chennai',
    bio: 'Advocate with specialisation in constitutional law. Ensures every answer on Jurisly is accurate and actionable.',
    avatar:
      'https://images.unsplash.com/photo-1607990283143-e81e7a2c9349?w=200&h=200&fit=crop&auto=format',
  },
  {
    name: 'Dev Kapoor',
    role: 'Product Design',
    city: 'Mumbai',
    bio: 'Designed civic tech products across 5 countries. Believes great design is the bridge between law and people.',
    avatar:
      'https://images.unsplash.com/photo-1764084051438-369ad6a09334?w=200&h=200&fit=crop&auto=format',
  },
];

const timeline = [
  {
    year: '2022',
    event:
      'Jurisly founded in a Delhi co-working space after Anika helps her housekeeper fight an illegal eviction — using only WhatsApp messages.',
  },
  {
    year: '2023',
    event:
      'First 500 users. Launched Hindi support. Featured in The Hindu and Scroll.in as "the legaltech startup making justice accessible".',
  },
  {
    year: '2024',
    event:
      'Document Review and Lawyer Connect features launched. Crossed ₹1 crore in revenue. Partnered with 200+ verified lawyers across 15 cities.',
  },
  {
    year: '2025',
    event:
      'Raised seed funding. Expanded to 8 Indian languages. Reached 2,000+ active users. Launched mobile app for Android.',
  },
  {
    year: '2026',
    event:
      'Launched KYR (Know Your Rights) module. Targeting 1 lakh users by end of year. Building for Bharat, one question at a time.',
  },
];

const press = [
  { name: 'The Hindu', quote: '"The startup making justice accessible to every Indian"' },
  { name: 'YourStory', quote: '"One of India\'s most promising legaltech startups of 2024"' },
  { name: 'Scroll.in', quote: '"Jurisly is what legal aid should have always looked like"' },
  { name: 'Inc42', quote: '"Top 10 social impact startups to watch in 2025"' },
];

export function AboutPage() {
  const openAuth = useOpenAuth();

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <section className="border-b border-[#E7E5E4] bg-[#FFF7ED] px-6 py-20">
        <div className="mx-auto max-w-[860px] text-center">
          <p
            className="mb-4 text-sm uppercase tracking-widest text-[#C2410C]"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
          >
            Our Mission
          </p>
          <blockquote
            className="mb-8 text-[#1C1917]"
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontWeight: 600,
              fontSize: 'clamp(24px, 4vw, 40px)',
              lineHeight: 1.3,
            }}
          >
            &ldquo;Every citizen of India deserves to understand the law that governs their life —
            in a language they speak, at a price they can afford.&rdquo;
          </blockquote>
          <p
            className="mx-auto max-w-lg text-[#78716C]"
            style={{ fontFamily: 'var(--font-body)', fontSize: '16px', lineHeight: 1.8 }}
          >
            We built Jurisly because we believe access to justice is a fundamental right — not a
            privilege for those who can afford a lawyer&apos;s fee.
          </p>
        </div>
      </section>

      <section className="border-b border-[#E7E5E4] bg-white px-6 py-12">
        <div className="mx-auto max-w-[860px]">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            {[
              { num: '2,000+', label: 'Active Users' },
              { num: '200+', label: 'Verified Lawyers' },
              { num: '8', label: 'Indian Languages' },
              { num: '₹0', label: 'Minimum Cost' },
            ].map((stat) => (
              <div key={stat.label}>
                <p
                  className="text-[#C2410C]"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: '36px',
                    lineHeight: 1,
                  }}
                >
                  {stat.num}
                </p>
                <p
                  className="mt-2 text-sm text-[#78716C]"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-[960px]">
          <div className="mb-12 text-center">
            <h2
              className="text-[#1C1917]"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 'clamp(28px, 4vw, 40px)',
              }}
            >
              The team behind Jurisly
            </h2>
            <p className="mt-3 text-base text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
              Lawyers, technologists, and designers — united by one mission.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <div
                key={member.name}
                className="rounded-[20px] border border-[#E7E5E4] bg-white p-6 text-center"
              >
                <div className="relative mx-auto mb-4 h-20 w-20 overflow-hidden rounded-full border-2 border-[#E7E5E4]">
                  <Image
                    src={member.avatar}
                    alt={member.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <h3
                  className="mb-0.5 text-[#1C1917]"
                  style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '17px' }}
                >
                  {member.name}
                </h3>
                <p
                  className="mb-0.5 text-xs text-[#C2410C]"
                  style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                >
                  {member.role}
                </p>
                <p
                  className="mb-3 text-xs text-[#78716C]"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {member.city}
                </p>
                <p
                  className="text-sm leading-relaxed text-[#78716C]"
                  style={{ fontFamily: 'var(--font-body)', lineHeight: 1.6 }}
                >
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-[720px]">
          <div className="mb-12 text-center">
            <h2
              className="text-[#1C1917]"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 'clamp(28px, 4vw, 40px)',
              }}
            >
              Our story
            </h2>
          </div>

          <div className="relative space-y-8 border-l-2 border-[#E7E5E4] pl-6">
            {timeline.map((item) => (
              <div key={item.year} className="relative">
                <div className="absolute -left-[33px] top-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#C2410C]">
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>

                <div className="pl-4">
                  <p
                    className="mb-1 text-sm text-[#C2410C]"
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}
                  >
                    {item.year}
                  </p>
                  <p
                    className="leading-relaxed text-[#1C1917]"
                    style={{ fontFamily: 'var(--font-body)', fontSize: '15px', lineHeight: 1.7 }}
                  >
                    {item.event}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#FAFAF9] px-6 py-16">
        <div className="mx-auto max-w-[860px]">
          <p
            className="mb-8 text-center text-xs uppercase tracking-widest text-[#78716C]"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
          >
            As seen in
          </p>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {press.map((p) => (
              <div
                key={p.name}
                className="rounded-[16px] border border-[#E7E5E4] bg-white p-5 text-center"
              >
                <p
                  className="mb-2 text-[#1C1917]"
                  style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px' }}
                >
                  {p.name}
                </p>
                <p
                  className="text-xs leading-relaxed text-[#78716C]"
                  style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
                >
                  {p.quote}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#C2410C] px-6 py-16">
        <div className="mx-auto max-w-[640px] text-center">
          <h2
            className="mb-4 text-white"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'clamp(24px, 4vw, 36px)',
            }}
          >
            Join us in making justice accessible.
          </h2>
          <p
            className="mb-8 text-[#FED7AA]"
            style={{ fontFamily: 'var(--font-body)', fontSize: '16px', lineHeight: 1.6 }}
          >
            Whether you have a legal question or want to help others with theirs — Jurisly is for
            you.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => openAuth('signup')}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[16px] bg-white px-7 text-sm text-[#C2410C] transition-all hover:bg-[#FFF7ED] active:scale-[0.97]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}
            >
              Get started free <ArrowRight size={16} />
            </button>
            <a
              href="mailto:hello@tryjurisly.com"
              className="inline-flex h-12 items-center justify-center rounded-[16px] border border-[#FED7AA] px-7 text-sm text-white transition-all hover:bg-white/10"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
            >
              Partner with us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
