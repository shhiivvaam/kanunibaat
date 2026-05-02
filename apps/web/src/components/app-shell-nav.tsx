'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { trpc } from '@jurisly/api-client';

export function AppShellNav() {
  const profile = trpc.profile.me.useQuery(undefined, { staleTime: 60_000 });
  const isLawyer = profile.data?.roles.includes('lawyer') ?? false;
  const t = useTranslations();

  return (
    <nav className="flex flex-wrap gap-4 text-sm" style={{ fontFamily: 'var(--font-body)' }}>
      <Link href="/app/consultations" className="text-[#57534E] hover:text-[#C2410C]">
        {t('nav.consultations')}
      </Link>
      <Link href="/app/vault" className="text-[#57534E] hover:text-[#C2410C]">
        {t('nav.vault')}
      </Link>
      <Link href="/app/notifications" className="text-[#57534E] hover:text-[#C2410C]">
        {t('nav.notifications')}
      </Link>
      <Link href="/app/billing" className="text-[#57534E] hover:text-[#C2410C]">
        {t('nav.billing')}
      </Link>
      {isLawyer ? (
        <Link href="/app/practice" className="text-[#57534E] hover:text-[#C2410C]">
          {t('nav.practice')}
        </Link>
      ) : null}
      {isLawyer ? (
        <Link href="/app/practice/analytics" className="text-[#57534E] hover:text-[#C2410C]">
          {t('nav.analytics')}
        </Link>
      ) : null}
      {isLawyer ? (
        <Link href="/app/practice/invoices" className="text-[#57534E] hover:text-[#C2410C]">
          {t('nav.invoices')}
        </Link>
      ) : null}
      {isLawyer ? (
        <Link href="/app/research" className="text-[#57534E] hover:text-[#C2410C]">
          {t('nav.research')}
        </Link>
      ) : null}
      <Link href="/" className="text-[#57534E] hover:text-[#C2410C]">
        {t('nav.marketingSite')}
      </Link>
    </nav>
  );
}
