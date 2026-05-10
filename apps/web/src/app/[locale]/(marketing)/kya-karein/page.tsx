import type { Metadata } from 'next';

import { EmergencyGuideHome } from '@/features/emergency-guide/emergency-guide-home';

export const metadata: Metadata = {
  title: 'Kya Karein? — Legal emergency guide',
  description:
    'Practical first steps for common legal situations in India — general information in English and Hindi, with a path to verified lawyers.',
};

export default function KyaKareinPage() {
  return (
    <div className="mx-auto max-w-[960px] px-6 py-16">
      <header className="mb-10">
        <h1
          className="text-3xl font-semibold text-[#1C1917]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Kya Karein? / What should you do?
        </h1>
        <p
          className="mt-3 max-w-2xl text-sm leading-relaxed text-[#57534E]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Choose a situation for general guidance on immediate steps, documents, and when to involve
          police or courts. This is not a substitute for calling emergency services or speaking to a
          lawyer about your specific case.
        </p>
      </header>
      <EmergencyGuideHome />
    </div>
  );
}
