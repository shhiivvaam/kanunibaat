import { headers } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AppShellNav } from '@/components/app-shell-nav';
import { PushNotificationsClient } from '@/components/push-notifications-client';
import { auth } from '@/lib/auth';

export default async function AppShellLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#1C1917]">
      <header className="border-b border-[#E7E5E4] bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link
            href="/app"
            className="text-sm font-semibold text-[#C2410C]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Jurisly
          </Link>
          <PushNotificationsClient />
          <AppShellNav />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10">{children}</main>
    </div>
  );
}
