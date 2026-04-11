'use client';

import { Check, ChevronDown, X as XIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { useOpenAuth } from '@/features/marketing/open-auth-context';

const plans = [
  {
    id: 'free',
    name: 'Naagrik Free',
    tagline: 'Start with the essentials',
    price: 0,
    period: '/forever',
    color: null,
    badge: null,
    cta: 'Get started free',
    features: [
      { text: 'Notice scanner (2 / month)', included: true },
      { text: 'Emergency legal guide access', included: true },
      { text: 'Basic lawyer search', included: true },
      { text: 'Document vault (up to 5 documents)', included: true },
      { text: 'Know Your Rights library', included: true },
      { text: 'Unlimited notice scans', included: false },
      { text: 'Priority lawyer matching', included: false },
      { text: 'Case tracker', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Naagrik Pro',
    tagline: 'For ongoing legal life admin',
    price: 199,
    period: '/month',
    color: '#C2410C',
    badge: 'Most Popular',
    cta: 'Join waitlist for Pro',
    features: [
      { text: 'Unlimited notice scans', included: true },
      { text: 'Priority lawyer matching', included: true },
      { text: 'Document vault (~5 GB)', included: true },
      { text: 'AI insights on your documents & notices', included: true },
      { text: 'Case tracker', included: true },
      { text: 'Emergency guide + Know Your Rights', included: true },
      { text: 'Hindi & English support', included: true },
      { text: 'Response draft suggestions (premium flows)', included: true },
    ],
  },
  {
    id: 'lawyer',
    name: 'Naagrik Plus',
    tagline: 'Hands-on support bundle',
    price: 999,
    period: '/month',
    color: '#1C1917',
    badge: null,
    cta: 'Join waitlist',
    features: [
      { text: 'Everything in Naagrik Pro', included: true },
      { text: 'Dedicated liaison for lawyer bookings', included: true },
      { text: 'Faster review turnaround on uploads', included: true },
      { text: 'Extended consult credits (as launched)', included: true },
      { text: 'Priority product support', included: true },
      { text: 'Early access to new modules', included: true },
      { text: 'Optional family add-on seats', included: true },
      { text: 'Invoice-ready receipts', included: true },
    ],
  },
];

const comparisons = [
  { feature: 'Notice scanner', free: '2/mo', pro: 'Unlimited', lawyer: 'Unlimited' },
  { feature: 'Emergency guide', free: true, pro: true, lawyer: true },
  { feature: 'Lawyer search', free: 'Basic', pro: 'Priority', lawyer: 'Priority+' },
  { feature: 'Document vault', free: '5 docs', pro: '~5 GB', lawyer: '~5 GB' },
  { feature: 'Know Your Rights', free: true, pro: true, lawyer: true },
  { feature: 'Case tracker', free: false, pro: true, lawyer: true },
  { feature: 'AI insights', free: false, pro: true, lawyer: true },
  { feature: 'Dedicated booking support', free: false, pro: false, lawyer: true },
];

const faqs = [
  {
    q: 'Is the free plan really free forever?',
    a: "Yes. You can use KanooniBaat's free tier with 3 legal questions and 1 document review per month, forever — no credit card required.",
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major UPI apps (GPay, PhonePe, Paytm), credit/debit cards (Visa, Mastercard, RuPay), and net banking.',
  },
  {
    q: 'Can I cancel my subscription anytime?',
    a: "Absolutely. You can cancel your subscription from your account settings at any time. You'll retain access until the end of your billing period.",
  },
  {
    q: 'Are the lawyers on the platform verified?',
    a: 'Yes. Every lawyer on KanooniBaat is verified through Bar Council registration, identity verification, and a minimum of 3 peer reviews before listing.',
  },
  {
    q: 'Is my legal information kept private?',
    a: 'Your legal queries and documents are encrypted and never shared with third parties. We are compliant with the Digital Personal Data Protection Act, 2023.',
  },
  {
    q: 'Can I get a refund?',
    a: "We offer a 7-day money-back guarantee for Pro and Lawyer Access plans if you're not satisfied. Contact support within 7 days of purchase.",
  },
];

export function PricingPage() {
  const openAuth = useOpenAuth();
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <div className="border-b border-[#E7E5E4] bg-[#FFF7ED] px-6 py-16 text-center">
        <div className="mx-auto max-w-[640px]">
          <p className="mb-3 text-sm uppercase tracking-widest text-[#C2410C]" style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}>
            Pricing
          </p>
          <h1
            className="mb-4 text-[#1C1917]"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 1.1 }}
          >
            Simple, honest pricing.
          </h1>
          <p className="text-[#78716C]" style={{ fontFamily: 'var(--font-body)', fontSize: '17px', lineHeight: 1.7 }}>
            Start free. Upgrade when you need more. No hidden fees, no surprise charges.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[960px] px-6 py-16">
        <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="relative flex flex-col rounded-[24px] p-8"
              style={{
                background: plan.id === 'pro' ? '#FFF7ED' : 'white',
                border: plan.id === 'pro' ? '2px solid #C2410C' : '1px solid #E7E5E4',
                boxShadow: plan.id === 'pro' ? '0 8px 32px rgba(194,65,12,0.12)' : 'none',
              }}
            >
              {plan.badge && (
                <div
                  className="absolute right-4 top-4 rounded-full px-3 py-1 text-xs text-white"
                  style={{ background: '#C2410C', fontFamily: 'var(--font-body)', fontWeight: 700 }}
                >
                  {plan.badge}
                </div>
              )}

              <h2 className="mb-1 text-[#1C1917]" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '22px' }}>
                {plan.name}
              </h2>
              <p className="mb-6 text-sm text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
                {plan.tagline}
              </p>

              <div className="mb-8 flex items-baseline gap-1">
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: '42px',
                    color: plan.color || '#1C1917',
                    lineHeight: 1,
                  }}
                >
                  {plan.price === 0 ? '₹0' : `₹${plan.price}`}
                </span>
                <span className="text-sm text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
                  {plan.period}
                </span>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li
                    key={f.text}
                    className="flex items-center gap-2.5 text-sm"
                    style={{
                      fontFamily: 'var(--font-body)',
                      color: f.included ? '#1C1917' : '#78716C',
                    }}
                  >
                    {f.included ? (
                      <Check size={14} style={{ color: plan.id === 'pro' ? '#C2410C' : '#15803D', flexShrink: 0 }} />
                    ) : (
                      <XIcon size={14} style={{ color: '#E7E5E4', flexShrink: 0 }} />
                    )}
                    {f.text}
                  </li>
                ))}
              </ul>

              {plan.id === 'free' ? (
                <button
                  type="button"
                  onClick={() => openAuth('signup')}
                  className="h-12 w-full rounded-[16px] text-sm transition-all duration-150 active:scale-[0.97]"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    background: 'transparent',
                    color: '#1C1917',
                    border: '1.5px solid #1C1917',
                  }}
                >
                  {plan.cta}
                </button>
              ) : (
                <Link
                  href="/waitlist"
                  className="flex h-12 w-full items-center justify-center rounded-[16px] text-sm transition-all duration-150 active:scale-[0.97]"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    background: plan.id === 'pro' ? '#C2410C' : '#1C1917',
                    color: 'white',
                  }}
                >
                  {plan.cta}
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="mb-16">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-[#1C1917]" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '24px' }}>
              Feature Comparison
            </h2>
            <button
              type="button"
              onClick={() => setShowAllFeatures(!showAllFeatures)}
              className="text-sm text-[#C2410C] hover:underline"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
            >
              {showAllFeatures ? 'Show highlights' : 'Show all features'}
            </button>
          </div>

          <div className="overflow-hidden rounded-[20px] border border-[#E7E5E4] bg-white">
            <div className="grid grid-cols-4 border-b border-[#E7E5E4] bg-[#FAFAF9]">
              <div className="px-5 py-4 text-sm text-[#78716C]" style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                Feature
              </div>
              {['Naagrik Free', 'Naagrik Pro', 'Naagrik Plus'].map((p) => (
                <div key={p} className="px-5 py-4 text-center text-sm text-[#1C1917]" style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}>
                  {p}
                </div>
              ))}
            </div>

            {(showAllFeatures ? comparisons : comparisons.slice(0, 5)).map((row, i) => (
              <div key={row.feature} className={`grid grid-cols-4 ${i > 0 ? 'border-t border-[#E7E5E4]' : ''}`}>
                <div className="px-5 py-4 text-sm text-[#1C1917]" style={{ fontFamily: 'var(--font-body)' }}>
                  {row.feature}
                </div>
                {[row.free, row.pro, row.lawyer].map((val, j) => (
                  <div key={j} className="flex items-center justify-center px-5 py-4">
                    {typeof val === 'boolean' ? (
                      val ? (
                        <Check size={16} className="text-[#15803D]" />
                      ) : (
                        <XIcon size={16} className="text-[#E7E5E4]" />
                      )
                    ) : (
                      <span className="text-center text-sm text-[#1C1917]" style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                        {val}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-8 text-center text-[#1C1917]" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '28px' }}>
            Frequently Asked Questions
          </h2>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={faq.q} className="overflow-hidden rounded-[16px] border border-[#E7E5E4] bg-white">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left"
                >
                  <span className="pr-4 text-[#1C1917]" style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '15px' }}>
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={18}
                    className="shrink-0 text-[#78716C] transition-transform duration-200"
                    style={{ transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5" style={{ animation: 'kb-marketing-panel-reveal 250ms ease-out' }}>
                    <p className="leading-relaxed text-[#78716C]" style={{ fontFamily: 'var(--font-body)', fontSize: '15px', lineHeight: 1.7 }}>
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 rounded-[24px] border border-[#E7E5E4] bg-white p-8 text-center md:p-10">
          <h3 className="mb-2 text-[#1C1917]" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '22px' }}>
            Advocates: separate plans
          </h3>
          <p className="mx-auto mb-5 max-w-lg text-[#78716C]" style={{ fontFamily: 'var(--font-body)', fontSize: '15px', lineHeight: 1.6 }}>
            Vakil Basic, Pro, Premium, and SME packages are built for practice management — see full detail on For
            Lawyers.
          </p>
          <Link
            href="/for-lawyers"
            className="inline-flex h-11 items-center rounded-[14px] bg-[#1C1917] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#292524]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            For Lawyers pricing
          </Link>
        </div>

        <div className="mt-8 rounded-[24px] border border-[#FED7AA] bg-[#FFF7ED] p-10 text-center">
          <h3 className="mb-3 text-[#1C1917]" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '24px' }}>
            Still not sure? Start free or join the waitlist.
          </h3>
          <p className="mx-auto mb-6 max-w-sm text-[#78716C]" style={{ fontFamily: 'var(--font-body)', fontSize: '15px', lineHeight: 1.6 }}>
            Naagrik Free is forever free. Pro and Plus are rolling out — reserve your spot.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => openAuth('signup')}
              className="h-12 rounded-[16px] bg-[#C2410C] px-8 text-sm text-white transition-all hover:bg-[#9a3409] active:scale-[0.97]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}
            >
              Preview sign-in (beta)
            </button>
            <Link
              href="/waitlist"
              className="inline-flex h-12 items-center rounded-[16px] border border-[#C2410C] bg-white px-8 text-sm font-semibold text-[#C2410C] transition-colors hover:bg-[#FFF7ED]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Join app waitlist
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
