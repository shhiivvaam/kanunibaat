import Link from 'next/link';

type MarketingLegalShellProps = {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
};

export function MarketingLegalShell({ title, lastUpdated, children }: MarketingLegalShellProps) {
  return (
    <div className="min-h-screen bg-[#FAFAF9] px-6 py-12">
      <article className="mx-auto max-w-[720px]">
        <p className="mb-6 text-sm text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
          <Link href="/" className="text-[#C2410C] hover:underline">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#1C1917]">{title}</span>
        </p>
        <header className="mb-10 border-b border-[#E7E5E4] pb-8">
          <h1
            className="text-3xl font-bold tracking-tight text-[#1C1917] md:text-4xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {title}
          </h1>
          <p className="mt-3 text-sm text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
            Last updated: {lastUpdated}
          </p>
        </header>
        <div
          className="space-y-6 text-[15px] leading-relaxed text-[#44403C]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {children}
        </div>
      </article>
    </div>
  );
}
