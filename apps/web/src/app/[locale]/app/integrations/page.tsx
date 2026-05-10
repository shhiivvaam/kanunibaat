import Link from 'next/link';

import { DigiLockerCard } from '@/features/integrations/digilocker-card';

export default function IntegrationsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8" style={{ fontFamily: 'var(--font-body)' }}>
      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-[#1C1917]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Integrations
        </h1>
        <p className="mt-2 text-sm text-[#57534E]">
          Connect external services to enhance your Jurisly experience.
        </p>
      </div>

      <div className="space-y-6">
        <DigiLockerCard />

        <section className="rounded-xl border border-[#E7E5E4] bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3
                  className="text-lg font-semibold text-[#1C1917]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Bar Council Verification
                </h3>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  Coming Soon
                </span>
              </div>
              <p className="mt-2 text-sm text-[#57534E]">
                Automated lawyer enrollment verification via Bar Council API. Currently, all
                verifications are processed manually by our team.
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-[#E7E5E4] bg-[#FAFAF9] px-4 py-3 text-sm text-[#57534E]">
            This integration is under development. Lawyer profiles are verified through our internal
            process.
          </div>
        </section>

        <section className="rounded-xl border border-[#E7E5E4] bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3
                  className="text-lg font-semibold text-[#1C1917]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  National Judicial Data Grid (NJDG)
                </h3>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                  Active
                </span>
              </div>
              <p className="mt-2 text-sm text-[#57534E]">
                Track case status across Indian courts. Integration is active for lawyers with case
                management enabled.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Link
              href="/app/case-tracker"
              className="inline-flex items-center text-sm font-medium text-[#C2410C] hover:underline"
            >
              Go to case tracker →
            </Link>
          </div>
        </section>

        <section className="rounded-xl border border-[#E7E5E4] bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3
                  className="text-lg font-semibold text-[#1C1917]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  WhatsApp Bot
                </h3>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                  Active
                </span>
              </div>
              <p className="mt-2 text-sm text-[#57534E]">
                Access Jurisly features via WhatsApp. Get quick answers to legal questions, scan
                notices, and connect with lawyers.
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-[#E7E5E4] bg-[#FAFAF9] px-4 py-3 text-sm text-[#57534E]">
            Save our WhatsApp number and send &quot;Hi&quot; to get started. Available in English
            and Hindi.
          </div>
        </section>
      </div>

      <div className="mt-8 rounded-xl border border-[#E7E5E4] bg-linear-to-br from-[#FFF7ED] to-white p-6">
        <h3
          className="text-sm font-semibold text-[#1C1917]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Need another integration?
        </h3>
        <p className="mt-2 text-sm text-[#57534E]">
          We&apos;re always looking to add integrations that make your legal work easier. Have a
          suggestion?{' '}
          <a
            href="mailto:support@tryjurisly.com"
            className="font-medium text-[#C2410C] hover:underline"
          >
            Let us know
          </a>
          .
        </p>
      </div>
    </div>
  );
}
