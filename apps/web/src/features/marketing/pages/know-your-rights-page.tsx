'use client';

import { ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useOpenAuth } from '@/features/marketing/open-auth-context';

const sections = [
  {
    id: 'workers',
    title: "Workers' Rights",
    emoji: '💼',
    color: '#1D4ED8',
    rights: [
      {
        headline: 'Right to Minimum Wage',
        scenario:
          'Ravi works in a garment factory in Tirupur. His employer started paying him ₹200/day — less than the state minimum wage for skilled workers.',
        law: 'Under the <strong>Minimum Wages Act, 1948</strong>, every employer must pay at least the minimum wage set by the state government. The minimum wage varies by state and type of work (skilled/unskilled/semi-skilled). As of 2024, most states have minimum wages above ₹300/day.',
        action:
          'File a complaint with the Labour Commissioner in your district. You can also approach the Labour Court. Complaints are free to file, and the employer may be fined up to ₹500 and/or imprisoned up to 6 months.',
      },
      {
        headline: 'Right to Gratuity',
        scenario:
          'Meena worked at a company for 7 years before resigning. Her employer refused to pay gratuity, claiming she resigned voluntarily.',
        law: "The <strong>Payment of Gratuity Act, 1972</strong> applies to all companies with 10+ employees. If you've completed 5 or more years of continuous service, you are entitled to gratuity — even if you resign (not just if you retire or are terminated). Gratuity = (Last salary × 15/26) × Years of service.",
        action:
          'Send a written notice to your employer. If no response within 30 days, file a complaint with the Controlling Authority (Labour Commissioner). The employer must pay within 30 days of becoming payable, else interest accrues.',
      },
    ],
  },
  {
    id: 'tenant',
    title: 'Tenant Rights',
    emoji: '🏠',
    color: '#C2410C',
    rights: [
      {
        headline: 'Right Against Illegal Eviction',
        scenario:
          "Seema's landlord changed her door lock while she was at work, demanding she vacate immediately because he wanted the flat for his son.",
        law: 'Self-help eviction — changing locks, removing belongings, or cutting electricity — is <strong>illegal</strong> across India. Under the <strong>Transfer of Property Act, 1882</strong> and state Rent Control Acts, a landlord can only evict through proper court process: filing an eviction suit in Rent Court and obtaining a court order.',
        action:
          'Call the police immediately — this is a criminal act. File an FIR under IPC Section 441 (criminal trespass). Also file a civil suit for injunction restoring possession. You can claim damages and rent for the illegal eviction period.',
      },
      {
        headline: 'Right to Get Security Deposit Back',
        scenario:
          'Vikash vacated his flat 2 months ago after giving proper notice, but his landlord is stalling on returning the ₹80,000 security deposit.',
        law: 'Under most state Rent Control Acts and the <strong>Transfer of Property Act</strong>, the landlord must return the deposit within 30–45 days of vacating (after accounting for legitimate deductions). Normal wear and tear cannot be deducted — only actual damage beyond normal use.',
        action:
          'Send a legal notice via registered post. If no response in 15 days, approach Consumer Forum (for amounts up to ₹50 lakh — free filing) or Civil Court. Keep all communication, bank records, and move-out photos as evidence.',
      },
    ],
  },
  {
    id: 'consumer',
    title: 'Consumer Rights',
    emoji: '🛒',
    color: '#15803D',
    rights: [
      {
        headline: 'Right to Refund for Defective Product',
        scenario:
          'Priya bought an air conditioner that broke down within 2 months. The company is offering only "repair" and refusing to replace or refund.',
        law: "Under the <strong>Consumer Protection Act, 2019</strong>, you have the right to replacement or refund if a product has a manufacturing defect, fails during warranty, or doesn't match promised specifications. The 2019 Act also holds e-commerce platforms liable as sellers. You can file for damages up to ₹1 crore in District Commission, up to ₹10 crore in State Commission.",
        action:
          'File a complaint online at consumerhelpline.gov.in or physically at the District Consumer Disputes Redressal Commission. Filing fee is minimal (₹200–₹1,000 depending on claim). You can file yourself — no lawyer required.',
      },
    ],
  },
  {
    id: 'women',
    title: "Women's Rights",
    emoji: '♀️',
    color: '#7C3AED',
    rights: [
      {
        headline: 'Right Against Workplace Harassment',
        scenario:
          'Anjali faces repeated inappropriate comments from her manager and was told by HR that she should "ignore it" and "not make a big deal."',
        law: "The <strong>Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013 (POSH Act)</strong> mandates every employer with 10+ employees to form an Internal Complaints Committee (ICC). HR's response is inadequate — you have a legal right to a fair investigation. The employer can be fined up to ₹50,000 for non-compliance.",
        action:
          'File a written complaint with the ICC within 3 months of the incident (can be extended). If your company has no ICC, file with the Local Complaints Committee (LCC) at the district level. You can also file an FIR under IPC Section 354A.',
      },
    ],
  },
  {
    id: 'digital',
    title: 'Digital Rights',
    emoji: '💻',
    color: '#0891B2',
    rights: [
      {
        headline: 'Right Against Data Misuse',
        scenario:
          'Rohit found out a fintech app shared his personal data and transaction history with third parties without his knowledge.',
        law: 'The <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> gives Indian citizens the right to know what data is collected, the right to correction/deletion, and the right to withdraw consent. Companies must disclose data sharing with third parties and get explicit consent. Penalty for non-compliance: up to ₹250 crore per instance.',
        action:
          'File a complaint with the Data Protection Board of India (operational from 2025). You can also file a complaint with CERT-In for cybercrime. Send a formal data deletion request to the company citing DPDP Act, 2023.',
      },
    ],
  },
];

export function KnowYourRightsPage() {
  const openAuth = useOpenAuth();
  const [activeSection, setActiveSection] = useState('workers');
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );

    const nodes = Object.values(sectionRefs.current).filter(Boolean) as HTMLElement[];
    nodes.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <div className="border-b border-[#E7E5E4] bg-white px-6 py-4">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex items-center gap-2 text-sm text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
            <span>Home</span>
            <span>/</span>
            <span className="text-[#C2410C]">Know Your Rights</span>
          </div>
          <h1 className="mt-1 text-[#1C1917]" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '28px' }}>
            Know Your Rights
          </h1>
          <p className="mt-1 text-sm text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
            Your rights under Indian law — explained in plain language with real-world scenarios.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="shrink-0 lg:w-[240px]">
            <div className="overflow-hidden rounded-[20px] border border-[#E7E5E4] bg-white lg:sticky lg:top-[80px]">
              <div className="border-b border-[#E7E5E4] px-5 py-4">
                <p className="text-xs uppercase tracking-wide text-[#1C1917]" style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}>
                  Table of Contents
                </p>
              </div>
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => scrollToSection(sec.id)}
                  className="flex w-full items-center gap-2.5 px-5 py-3 text-left text-sm transition-all"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: activeSection === sec.id ? 600 : 400,
                    color: activeSection === sec.id ? '#C2410C' : '#1C1917',
                    background: activeSection === sec.id ? '#FFF7ED' : 'white',
                    borderLeft: activeSection === sec.id ? '3px solid #C2410C' : '3px solid transparent',
                  }}
                >
                  <span>{sec.emoji}</span>
                  {sec.title}
                </button>
              ))}
            </div>
          </aside>

          <div className="flex-1 space-y-12">
            {sections.map((sec) => (
              <section
                key={sec.id}
                id={sec.id}
                ref={(el) => {
                  sectionRefs.current[sec.id] = el;
                }}
                className="scroll-mt-24"
              >
                <div className="mb-6 flex items-center gap-3">
                  <span style={{ fontSize: '28px' }}>{sec.emoji}</span>
                  <h2 className="text-[#1C1917]" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '26px' }}>
                    {sec.title}
                  </h2>
                </div>

                <div className="space-y-6">
                  {sec.rights.map((right) => (
                    <div key={right.headline} className="overflow-hidden rounded-[20px] border border-[#E7E5E4] bg-white">
                      <div className="h-1" style={{ background: sec.color }} />

                      <div className="space-y-5 p-6">
                        <h3 className="text-[#1C1917]" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '20px' }}>
                          {right.headline}
                        </h3>

                        <div className="rounded-[12px] border border-[#E7E5E4] bg-[#FAFAF9] p-4">
                          <p className="mb-2 text-xs uppercase tracking-wide text-[#78716C]" style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                            Scenario
                          </p>
                          <p
                            className="text-[#1C1917]"
                            style={{
                              fontFamily: 'var(--font-display)',
                              fontStyle: 'italic',
                              fontSize: '15px',
                              lineHeight: 1.7,
                            }}
                          >
                            {right.scenario}
                          </p>
                        </div>

                        <div>
                          <p className="mb-2 text-xs uppercase tracking-wide text-[#78716C]" style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                            What the law says
                          </p>
                          <p
                            className="leading-relaxed text-[#1C1917]"
                            style={{ fontFamily: 'var(--font-body)', fontSize: '15px', lineHeight: 1.7 }}
                            dangerouslySetInnerHTML={{ __html: right.law }}
                          />
                        </div>

                        <div className="rounded-[12px] border border-[#FED7AA] bg-[#FFF7ED] p-4">
                          <p className="mb-2 text-xs uppercase tracking-wide text-[#C2410C]" style={{ fontFamily: 'var(--font-body)', fontWeight: 700 }}>
                            What you can do
                          </p>
                          <p className="leading-relaxed text-[#1C1917]" style={{ fontFamily: 'var(--font-body)', fontSize: '15px', lineHeight: 1.7 }}>
                            {right.action}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => openAuth('signup')}
                          className="flex items-center gap-2 text-sm text-[#C2410C] transition-all hover:gap-3"
                          style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
                        >
                          Get help with this <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
