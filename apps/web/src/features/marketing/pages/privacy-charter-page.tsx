import Link from 'next/link';

import { MarketingLegalShell } from '@/features/marketing/components/marketing-legal-shell';

export function PrivacyCharterPage() {
  return (
    <MarketingLegalShell title="Privacy Charter" lastUpdated="11 April 2026">
      <p className="text-lg text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
        Our public promise on how we treat your data and dignity.
      </p>
      <p>
        Jurisly exists to make law accessible — not to exploit your trust. This Privacy Charter
        summarises the commitments behind our platform. The full{' '}
        <Link href="/privacy" className="text-[#C2410C] hover:underline">
          Privacy Policy
        </Link>{' '}
        has legal detail; this page is the spirit of how we build.
      </p>

      <ol className="list-decimal space-y-6 pl-5 pt-2">
        <li>
          <strong className="text-[#1C1917]">Your data is yours.</strong> We collect only what we
          need to run the service, improve safety, and comply with law. We do not sell your personal
          information.
        </li>
        <li>
          <strong className="text-[#1C1917]">Transparency.</strong> We explain what we collect and
          why, in plain language. When we use new types of data in meaningful ways, we will tell
          you.
        </li>
        <li>
          <strong className="text-[#1C1917]">Control.</strong> Where the law gives you rights —
          access, correction, deletion, consent withdrawal — we will honour them through clear
          channels.
        </li>
        <li>
          <strong className="text-[#1C1917]">Security.</strong> We design with security in mind and
          work with trusted partners under strict agreements. We continuously improve as threats
          evolve.
        </li>
        <li>
          <strong className="text-[#1C1917]">AI assists; humans decide on law.</strong> Automated
          tools may summarise or organise information. They do not replace a qualified lawyer.
          Sensitive legal decisions stay with you and your advocate.
        </li>
        <li>
          <strong className="text-[#1C1917]">India first.</strong> We build for Indian users and
          Indian law, including the DPDP Act. Cross-border handling follows applicable rules.
        </li>
        <li>
          <strong className="text-[#1C1917]">We listen.</strong> If something feels wrong, contact
          us at{' '}
          <a href="mailto:privacy@tryjurisly.com" className="text-[#C2410C] hover:underline">
            privacy@tryjurisly.com
          </a>
          . We take feedback seriously.
        </li>
      </ol>

      <p className="rounded-xl border border-[#FED7AA] bg-[#FFF7ED] p-4 text-sm text-[#9a3409]">
        This Charter is a statement of intent. It does not replace the Privacy Policy or Terms of
        Service for legal purposes.
      </p>
    </MarketingLegalShell>
  );
}
