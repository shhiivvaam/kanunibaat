import Link from 'next/link';

import { MarketingLegalShell } from '@/features/marketing/components/marketing-legal-shell';

export function TermsPage() {
  return (
    <MarketingLegalShell title="Terms of Service" lastUpdated="11 April 2026">
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use of KanooniBaat&apos;s website, mobile
        applications, and related services (collectively, the &quot;Services&quot;). By using the Services, you agree to
        these Terms. If you do not agree, do not use the Services.
      </p>

      <h2 className="pt-4 text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
        1. Who we are
      </h2>
      <p>
        The Services are operated by KanooniBaat (the legal entity name as applicable in your jurisdiction). Contact:{' '}
        <a href="mailto:hello@kanoonibaat.in" className="text-[#C2410C] hover:underline">
          hello@kanoonibaat.in
        </a>
        .
      </p>

      <h2 className="pt-4 text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
        2. Not legal advice
      </h2>
      <p>
        KanooniBaat provides informational tools, educational content, and technology to help you understand legal topics
        and connect with independent lawyers. <strong>Nothing on the platform is legal advice.</strong> Use of the
        Services does not create an attorney–client relationship with KanooniBaat. For advice on your specific
        situation, consult a qualified advocate licensed in India.
      </p>

      <h2 className="pt-4 text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
        3. Eligibility
      </h2>
      <p>
        You must be at least 18 years old and capable of forming a binding contract under Indian law. If you use the
        Services on behalf of an organisation, you represent that you have authority to bind that organisation.
      </p>

      <h2 className="pt-4 text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
        4. Accounts
      </h2>
      <p>
        You are responsible for maintaining the confidentiality of your account credentials and for all activity under
        your account. Notify us promptly of unauthorised use.
      </p>

      <h2 className="pt-4 text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
        5. Acceptable use
      </h2>
      <p>You agree not to:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>Violate any law or third-party rights;</li>
        <li>Upload malware, scrape the Services in bulk without permission, or attempt to gain unauthorised access;</li>
        <li>Use the Services to harass, defame, or impersonate others;</li>
        <li>Misrepresent your identity or professional credentials;</li>
        <li>Reverse engineer or copy our software except as permitted by law.</li>
      </ul>

      <h2 className="pt-4 text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
        6. Lawyers and marketplace
      </h2>
      <p>
        Lawyers listed on the platform are independent professionals. KanooniBaat may facilitate discovery and
        technology; <strong>we do not guarantee outcomes</strong> of any consultation or case. Fees, scope, and
        engagement terms are between you and the lawyer unless otherwise stated in a separate agreement with us.
      </p>

      <h2 className="pt-4 text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
        7. Fees and payments
      </h2>
      <p>
        Certain features may be free or paid. Prices and payment terms will be presented before you commit. Taxes may
        apply. Refunds, if any, follow the policy stated at the time of purchase.
      </p>

      <h2 className="pt-4 text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
        8. Intellectual property
      </h2>
      <p>
        The Services, branding, and content we create are owned by KanooniBaat or our licensors. You receive a limited,
        non-exclusive licence to use the Services for personal or internal business use. You retain rights in content you
        submit; you grant us a licence to use it to operate and improve the Services.
      </p>

      <h2 className="pt-4 text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
        9. Disclaimers
      </h2>
      <p>
        THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS
        OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. We do not warrant
        uninterrupted or error-free operation.
      </p>

      <h2 className="pt-4 text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
        10. Limitation of liability
      </h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, KANOONIBAAT AND ITS AFFILIATES WILL NOT BE LIABLE FOR ANY
        INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR LOSS OF PROFITS OR DATA, ARISING FROM YOUR
        USE OF THE SERVICES. OUR AGGREGATE LIABILITY FOR CLAIMS RELATING TO THE SERVICES SHALL NOT EXCEED THE GREATER OF
        (A) THE AMOUNT YOU PAID US IN THE TWELVE MONTHS BEFORE THE CLAIM OR (B) INR 5,000.
      </p>

      <h2 className="pt-4 text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
        11. Indemnity
      </h2>
      <p>
        You will defend and indemnify KanooniBaat against claims arising from your misuse of the Services, your content,
        or your violation of these Terms, subject to applicable law.
      </p>

      <h2 className="pt-4 text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
        12. Governing law and disputes
      </h2>
      <p>
        These Terms are governed by the laws of India. Courts at Bengaluru, Karnataka shall have exclusive jurisdiction,
        subject to any mandatory consumer protections in your state.
      </p>

      <h2 className="pt-4 text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
        13. Changes
      </h2>
      <p>
        We may modify these Terms. We will provide notice as required by law (e.g. posting an updated version). Continued
        use after the effective date may constitute acceptance.
      </p>

      <h2 className="pt-4 text-xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
        14. Privacy
      </h2>
      <p>
        Our{' '}
        <Link href="/privacy" className="text-[#C2410C] hover:underline">
          Privacy Policy
        </Link>{' '}
        describes how we handle personal data.
      </p>
    </MarketingLegalShell>
  );
}
