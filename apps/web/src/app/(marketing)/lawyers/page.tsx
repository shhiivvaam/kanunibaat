import type { Metadata } from 'next';
import { Suspense } from 'react';

import { LawyersDirectory } from '@/features/lawyers/lawyers-directory';

export const metadata: Metadata = {
  title: 'Find a lawyer',
  description: 'Browse verified advocates on KanuniBaat — search by city, practice area, and more.',
  openGraph: {
    title: 'Find a lawyer | KanuniBaat',
    description: 'Browse verified advocates — discovery backed by Postgres with optional Meilisearch acceleration.',
  },
};

export default function LawyersPage() {
  return (
    <div className="mx-auto max-w-[960px] px-6 py-16">
      <header className="mb-10">
        <h1
          className="text-3xl font-semibold tracking-tight text-[#1C1917] sm:text-4xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Find a verified lawyer
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#57534E]" style={{ fontFamily: 'var(--font-body)' }}>
          Every profile here has passed KanuniBaat verification. Search tries Meilisearch when configured and always
          falls back to our database so the directory stays available.
        </p>
      </header>
      <Suspense fallback={<p className="text-sm text-[#78716C]">Loading directory…</p>}>
        <LawyersDirectory />
      </Suspense>
    </div>
  );
}
