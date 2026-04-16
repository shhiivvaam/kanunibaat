'use client';

import Link from 'next/link';

import { trpc } from '@kb/api-client';

export function AppShellNav() {
  const profile = trpc.profile.me.useQuery(undefined, { staleTime: 60_000 });
  const isLawyer = profile.data?.roles.includes('lawyer') ?? false;

  return (
    <nav className="flex flex-wrap gap-4 text-sm" style={{ fontFamily: 'var(--font-body)' }}>
      <Link href="/app/consultations" className="text-[#57534E] hover:text-[#C2410C]">
        Consultations
      </Link>
      <Link href="/app/vault" className="text-[#57534E] hover:text-[#C2410C]">
        Vault
      </Link>
      <Link href="/app/notifications" className="text-[#57534E] hover:text-[#C2410C]">
        Notifications
      </Link>
      <Link href="/app/billing" className="text-[#57534E] hover:text-[#C2410C]">
        Billing
      </Link>
      {isLawyer ? (
        <Link href="/app/practice" className="text-[#57534E] hover:text-[#C2410C]">
          Practice
        </Link>
      ) : null}
      {isLawyer ? (
        <Link href="/app/practice/analytics" className="text-[#57534E] hover:text-[#C2410C]">
          Analytics
        </Link>
      ) : null}
      {isLawyer ? (
        <Link href="/app/practice/invoices" className="text-[#57534E] hover:text-[#C2410C]">
          Invoices
        </Link>
      ) : null}
      {isLawyer ? (
        <Link href="/app/research" className="text-[#57534E] hover:text-[#C2410C]">
          Research
        </Link>
      ) : null}
      <Link href="/" className="text-[#57534E] hover:text-[#C2410C]">
        Marketing site
      </Link>
    </nav>
  );
}
