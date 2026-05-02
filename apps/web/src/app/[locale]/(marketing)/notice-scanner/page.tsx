import type { Metadata } from 'next';

import { NoticeScanner } from '@/features/notice-scanner/notice-scanner';

export const metadata: Metadata = {
  title: 'Notice Scanner',
  description: 'Upload a legal notice and get a plain-language explanation with next steps.',
};

export default function NoticeScannerPage() {
  return (
    <div className="mx-auto max-w-[900px] px-6 py-16">
      <header className="mb-10">
        <h1
          className="text-3xl font-semibold text-[#1C1917]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Notice Scanner
        </h1>
        <p
          className="mt-3 max-w-2xl text-sm leading-relaxed text-[#57534E]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Scan a legal notice to understand what it says, what’s urgent, and what you can do next.
          This is general information, not legal advice.
        </p>
      </header>
      <NoticeScanner />
    </div>
  );
}
