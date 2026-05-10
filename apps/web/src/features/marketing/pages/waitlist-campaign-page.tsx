import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  BookOpen,
  Briefcase,
  Calendar,
  FileText,
  Gavel,
  Landmark,
  Lock,
  MessageSquare,
  Scale,
  Search,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';
import Link from 'next/link';

import { WaitlistCampaignLeadForm } from '@/features/marketing/waitlist-campaign-lead-form';

const problems = [
  {
    title: 'Legal help feels out of reach',
    detail: 'Consultations are costly and hard to schedule when you are already stressed.',
  },
  {
    title: 'Paperwork is overwhelming',
    detail: 'Notices and court updates arrive in language that is tough to decode on your own.',
  },
  {
    title: 'Trust is everything',
    detail: 'You need clear information — and a real advocate when it is time to act.',
  },
];

const forPeople = [
  {
    icon: FileText,
    title: 'Understand any notice',
    body: 'Upload a notice or letter. Get a plain-language readout of what it says and what it may mean for you.',
  },
  {
    icon: Sparkles,
    title: 'First steps when something goes wrong',
    body: 'Curated guides for common situations — what to do now, what to avoid, and when to call a lawyer or the police.',
  },
  {
    icon: Users,
    title: 'Find verified advocates',
    body: 'Discover lawyers by practice area and language, see how they consult, and book a session when you are ready.',
  },
  {
    icon: Lock,
    title: 'A private document locker',
    body: 'Store papers encrypted so only you hold the keys. Share time-limited access when you choose.',
  },
  {
    icon: Bell,
    title: 'Court-date and status updates',
    body: 'Follow matters you care about with clearer snapshots of hearings and next steps where data is available.',
  },
  {
    icon: BookOpen,
    title: 'Know your rights — in your language',
    body: 'Short explainers on everyday situations. A question forum for general information, not a substitute for advice on your case.',
  },
  {
    icon: MessageSquare,
    title: 'Consultations that fit your life',
    body: 'Chat-first help with room to move to voice or video when you and your advocate agree.',
  },
  {
    icon: Landmark,
    title: 'Built for India',
    body: 'English today, with more Indian languages rolling out — so clarity is never only for English speakers.',
  },
];

const forAdvocates = [
  {
    icon: Briefcase,
    title: 'Matters, clients, and deadlines',
    body: 'Keep cases, hearing notes, and tasks in one place instead of scattered threads and folders.',
  },
  {
    icon: Calendar,
    title: 'Hearings and reminders',
    body: 'See what is next across matters and nudge clients when something important is due.',
  },
  {
    icon: Search,
    title: 'Research and drafting support',
    body: 'Search judgments and acts, trace citations, and speed up first drafts — you stay in control of final advice.',
  },
  {
    icon: Scale,
    title: 'Billing that matches your practice',
    body: 'Invoices, GST-friendly records, and a clearer picture of revenue over time.',
  },
  {
    icon: Gavel,
    title: 'Consult with clients on the platform',
    body: 'Offer structured sessions with people who are already oriented — fewer repeated explanations, more time for strategy.',
  },
];

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[20px] border border-[#E7E5E4] bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#C2410C]">
        <Icon size={22} strokeWidth={1.75} aria-hidden />
      </div>
      <h3
        className="mb-2 text-base font-bold text-[#1C1917]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h3>
      <p
        className="text-sm leading-relaxed text-[#57534E]"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {body}
      </p>
    </div>
  );
}

export function WaitlistCampaignPage() {
  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 -top-40 h-[480px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,#FFF7ED_0%,transparent_55%)]"
        aria-hidden
      />

      <section className="relative mx-auto max-w-[1200px] px-6 pb-16 pt-10 md:pb-20 md:pt-14">
        <p
          className="mb-4 inline-flex rounded-full border border-[#FED7AA] bg-[#FFFBEB] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#9a3412]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Early access
        </p>
        <h1
          className="max-w-4xl text-[#1C1917]"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 'clamp(2rem, 5vw, 3.25rem)',
            lineHeight: 1.12,
          }}
        >
          Legal clarity for every Indian — plain language, real advocates, privacy you can see.
        </h1>
        <p
          className="mt-6 max-w-2xl text-lg text-[#57534E] md:text-xl"
          style={{ fontFamily: 'var(--font-body)', lineHeight: 1.65 }}
        >
          Jurisly is building the layer people reach for when law touches their life: orientation
          from AI, decisions with verified lawyers, and tools that respect your documents and your
          dignity.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <a
            href="#waitlist-form"
            className="inline-flex h-12 items-center justify-center rounded-[16px] bg-[#C2410C] px-8 text-sm font-semibold text-white transition-colors hover:bg-[#9a3409]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Get early access
          </a>
          <Link
            href="/waitlist/lawyer"
            className="inline-flex h-12 items-center justify-center rounded-[16px] border border-[#1C1917] px-8 text-sm font-semibold text-[#1C1917] transition-colors hover:bg-[#1C1917] hover:text-white"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            I am an advocate
          </Link>
        </div>
      </section>

      <section className="relative border-y border-[#E7E5E4] bg-white py-14 md:py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <h2
            className="mb-10 text-center text-2xl font-bold text-[#1C1917] md:text-3xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Why this exists
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {problems.map((p) => (
              <div key={p.title} className="rounded-[20px] bg-[#FAFAF9] p-6">
                <h3
                  className="mb-2 text-lg font-bold text-[#1C1917]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {p.title}
                </h3>
                <p
                  className="text-sm leading-relaxed text-[#57534E]"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {p.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-[1200px] px-6 py-16 md:py-20">
        <h2
          className="mb-3 text-2xl font-bold text-[#1C1917] md:text-3xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          For people and families
        </h2>
        <p
          className="mb-10 max-w-2xl text-[#57534E]"
          style={{ fontFamily: 'var(--font-body)', lineHeight: 1.65 }}
        >
          Everything here is designed to reduce fear and confusion — then hand you to a qualified
          advocate when your situation needs one.
        </p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {forPeople.map((f) => (
            <FeatureCard key={f.title} icon={f.icon} title={f.title} body={f.body} />
          ))}
        </div>
      </section>

      <section className="relative border-t border-[#E7E5E4] bg-[#1C1917] py-16 text-white md:py-20">
        <div className="mx-auto max-w-[1200px] px-6">
          <h2
            className="mb-3 text-2xl font-bold md:text-3xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            For advocates and chambers
          </h2>
          <p
            className="mb-10 max-w-2xl text-[#D6D3D1]"
            style={{ fontFamily: 'var(--font-body)', lineHeight: 1.65 }}
          >
            Professional tools that shorten admin and research — without turning law into a race to
            the bottom on fees.
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {forAdvocates.map((f) => (
              <div
                key={f.title}
                className="rounded-[20px] border border-[#44403C] bg-[#292524] p-6 transition-colors hover:border-[#57534E]"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#C2410C]/20 text-[#FDBA74]">
                  <f.icon size={22} strokeWidth={1.75} aria-hidden />
                </div>
                <h3
                  className="mb-2 text-base font-bold"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {f.title}
                </h3>
                <p
                  className="text-sm leading-relaxed text-[#A8A29E]"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {f.body}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/waitlist/lawyer"
              className="inline-flex h-12 items-center justify-center rounded-[16px] bg-[#C2410C] px-8 text-sm font-semibold text-white hover:bg-[#EA580C]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Join the advocate waitlist
            </Link>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-[1200px] px-6 py-16 md:py-20">
        <div className="rounded-[24px] border border-[#BBF7D0] bg-[#F0FDF4] p-8 md:p-12">
          <div className="mb-6 flex items-center gap-3">
            <Shield className="h-9 w-9 text-[#166534]" strokeWidth={1.75} aria-hidden />
            <h2
              className="text-xl font-bold text-[#14532D] md:text-2xl"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Safety and privacy
            </h2>
          </div>
          <ul className="space-y-4 text-[#166534]" style={{ fontFamily: 'var(--font-body)' }}>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#166534]" aria-hidden />
              <span>
                <strong className="text-[#14532D]">Your locker, your keys.</strong> Sensitive
                documents can be encrypted on your device before they ever leave it, so you choose
                what to share and for how long.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#166534]" aria-hidden />
              <span>
                <strong className="text-[#14532D]">AI orients; lawyers decide.</strong> Tools
                summarize and suggest next steps — never a substitute for advice on your specific
                matter.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#166534]" aria-hidden />
              <span>
                <strong className="text-[#14532D]">Data minimisation aligned with DPDP.</strong> We
                collect what we need to run the service, explain why, and support your rights under
                Indian privacy law.
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section className="relative mx-auto max-w-[900px] px-6 pb-16 text-center md:pb-20">
        <p
          className="text-lg leading-relaxed text-[#44403C] md:text-xl"
          style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 500 }}
        >
          Our north star is simple: be the name families mention when law feels too heavy — and the
          workspace advocates trust to practice with dignity. Not another anonymous listing.
          Infrastructure for a fairer conversation with the law.
        </p>
      </section>

      <section className="relative mx-auto max-w-[1200px] px-6 pb-20">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <WaitlistCampaignLeadForm />
          </div>
          <div className="lg:col-span-7">
            <h2
              className="mb-6 text-2xl font-bold text-[#1C1917]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Questions
            </h2>
            <div className="space-y-3">
              {[
                {
                  q: 'Is Jurisly giving me legal advice?',
                  a: 'No. We provide general information and tools. For your specific situation you should speak with a qualified advocate.',
                },
                {
                  q: 'Who are the lawyers on the platform?',
                  a: 'Advocates go through enrollment checks and manual review before they are shown as verified. We list real professionals — not anonymous “experts”.',
                },
                {
                  q: 'Which languages will you support?',
                  a: 'We are rolling out English and Hindi first, with more Indian languages following as fast as we can do them well.',
                },
                {
                  q: 'What happens to my data?',
                  a: 'We design around the Digital Personal Data Protection Act: clear notices, limited retention, and strong options for sensitive documents.',
                },
              ].map((item) => (
                <details
                  key={item.q}
                  className="group rounded-[16px] border border-[#E7E5E4] bg-white px-5 py-3 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary
                    className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-sm font-semibold text-[#1C1917]"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {item.q}
                    <span
                      className="text-[#78716C] transition-transform group-open:rotate-180"
                      aria-hidden
                    >
                      ▾
                    </span>
                  </summary>
                  <p
                    className="mt-3 border-t border-[#F5F5F4] pt-3 text-sm leading-relaxed text-[#57534E]"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
            <p className="mt-8 text-sm text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
              Read our{' '}
              <Link href="/privacy-charter" className="font-medium text-[#C2410C] hover:underline">
                Privacy Charter
              </Link>{' '}
              or{' '}
              <Link href="/privacy" className="font-medium text-[#C2410C] hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
