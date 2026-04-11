import Link from 'next/link';

import { MarketingLegalShell } from '@/features/marketing/components/marketing-legal-shell';

export function PrivacyPage() {
  return (
    <MarketingLegalShell title="Privacy Policy" lastUpdated="11 April 2026">
      <p>
        KanooniBaat (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the website and services at kanoonibaat.in
        and related properties. This Privacy Policy explains how we collect, use, store, and protect your personal data
        when you use our platform. We are committed to compliance with the Digital Personal Data Protection Act, 2023
        (DPDP Act) and applicable Indian law.
      </p>

      <h2 className="pt-4 text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
        1. Data we collect
      </h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Identity and contact:</strong> name, email address, phone number when you register, join a waitlist, or
          contact us.
        </li>
        <li>
          <strong>Account and usage:</strong> preferences, device type, approximate location (if you allow), and
          interactions with our services.
        </li>
        <li>
          <strong>Content you provide:</strong> questions, documents, or messages you submit for features such as legal
          Q&amp;A or document review. Sensitive legal information should only be shared when you understand how it will
          be used, as described in product-specific terms.
        </li>
        <li>
          <strong>Technical data:</strong> IP address, browser type, cookies, and similar technologies as described in
          the{' '}
          <Link href="/privacy#cookies" className="text-[#C2410C] hover:underline">
            Cookies
          </Link>{' '}
          section.
        </li>
      </ul>

      <h2 className="pt-4 text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
        2. How we use your data
      </h2>
      <p>We use personal data to:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>Provide, maintain, and improve our services;</li>
        <li>Authenticate users and prevent fraud;</li>
        <li>Send service-related communications and, where permitted, marketing (you may opt out);</li>
        <li>Comply with legal obligations and respond to lawful requests;</li>
        <li>Analyse aggregated usage to improve product experience.</li>
      </ul>
      <p>
        We do not sell your personal data. AI-assisted features process information to generate informational output;
        they do not replace professional legal advice.
      </p>

      <h2 className="pt-4 text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
        3. Legal basis and consent
      </h2>
      <p>
        We process data based on your consent (where required), performance of a contract, legitimate interests (such as
        security and analytics, balanced against your rights), and legal obligation. You may withdraw consent where
        processing is consent-based, subject to applicable law.
      </p>

      <h2 className="pt-4 text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
        4. Sharing and processors
      </h2>
      <p>
        We may share data with vetted service providers (e.g. hosting, email delivery, analytics) who process it on our
        instructions under contract. We may disclose information if required by law or to protect rights and safety. Any
        transfer outside India will follow applicable DPDP and regulatory requirements.
      </p>

      <h2 className="pt-4 text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
        5. Retention
      </h2>
      <p>
        We retain data only as long as necessary for the purposes above, including legal, accounting, and dispute
        resolution needs. You may request deletion subject to exceptions (e.g. ongoing legal obligations).
      </p>

      <h2 className="pt-4 text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
        6. Your rights (DPDP)
      </h2>
      <p>Depending on applicable law, you may have the right to:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>Access and obtain a copy of your personal data;</li>
        <li>Correct inaccurate data;</li>
        <li>Request erasure;</li>
        <li>Withdraw consent and object to certain processing;</li>
        <li>Lodge a complaint with the Data Protection Board of India.</li>
      </ul>
      <p>
        To exercise these rights, contact us at{' '}
        <a href="mailto:privacy@kanoonibaat.in" className="text-[#C2410C] hover:underline">
          privacy@kanoonibaat.in
        </a>
        .
      </p>

      <h2 className="pt-4 text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
        7. Security
      </h2>
      <p>
        We implement appropriate technical and organisational measures to protect your data. No method of transmission
        over the Internet is 100% secure; we encourage strong passwords and caution when sharing sensitive information.
      </p>

      <h2
        id="cookies"
        className="scroll-mt-24 pt-4 text-xl font-semibold text-[#1C1917]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        8. Cookies and similar technologies
      </h2>
      <p>
        We use cookies and similar technologies for essential site function, preferences, and analytics. You can control
        cookies through your browser settings. Strictly necessary cookies may be required for the service to work.
      </p>

      <h2 className="pt-4 text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
        9. Children
      </h2>
      <p>
        Our services are not directed at children under 18. If you believe we have collected data from a child, please
        contact us and we will take appropriate steps.
      </p>

      <h2 className="pt-4 text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
        10. Changes
      </h2>
      <p>
        We may update this policy from time to time. We will post the revised version with an updated date. Continued use
        after changes constitutes acceptance where permitted by law.
      </p>

      <h2 className="pt-4 text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
        11. Contact
      </h2>
      <p>
        Questions about this Privacy Policy:{' '}
        <a href="mailto:privacy@kanoonibaat.in" className="text-[#C2410C] hover:underline">
          privacy@kanoonibaat.in
        </a>{' '}
        or{' '}
        <a href="mailto:hello@kanoonibaat.in" className="text-[#C2410C] hover:underline">
          hello@kanoonibaat.in
        </a>
        .
      </p>
      <p className="pt-4 text-sm text-[#78716C]">
        See also our{' '}
        <Link href="/privacy-charter" className="text-[#C2410C] hover:underline">
          Privacy Charter
        </Link>{' '}
        for our public commitments in plain language.
      </p>
    </MarketingLegalShell>
  );
}
