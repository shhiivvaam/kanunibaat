import { EMERGENCY_SCENARIOS } from '@jurisly/emergency-guide';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { EmergencyGuideDetail } from '@/features/emergency-guide/emergency-guide-detail';

const SLUGS = new Set(EMERGENCY_SCENARIOS.map((s) => s.slug));

export function generateStaticParams() {
  return EMERGENCY_SCENARIOS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const scenario = EMERGENCY_SCENARIOS.find((s) => s.slug === slug);
  if (!scenario) {
    return { title: 'Guide not found' };
  }
  return {
    title: `${scenario.titleEn} | Kya Karein?`,
    description: `${scenario.titleHi} — General legal information and first steps on Jurisly.`,
  };
}

export default async function KyaKareinScenarioPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!SLUGS.has(slug)) {
    notFound();
  }
  return (
    <div className="mx-auto max-w-[960px] px-6 py-16">
      <EmergencyGuideDetail slug={slug} />
    </div>
  );
}
