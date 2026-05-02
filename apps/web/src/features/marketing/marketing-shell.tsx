'use client';

import { useCallback, useState } from 'react';

import { AuthModal } from '@/features/marketing/auth-modal';
import { Footer } from '@/features/marketing/footer';
import { Navbar } from '@/features/marketing/navbar';
import { OpenAuthContextProvider, type AuthTab } from '@/features/marketing/open-auth-context';

export function MarketingShell({
  children,
  variant = 'full',
}: {
  children: React.ReactNode;
  variant?: 'full' | 'waitlist';
}) {
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<AuthTab>('login');

  const openAuth = useCallback((tab: AuthTab = 'login') => {
    setAuthTab(tab);
    setAuthOpen(true);
  }, []);

  return (
    <OpenAuthContextProvider value={openAuth}>
      <div className="flex min-h-screen flex-col bg-[#FAFAF9]">
        <Navbar variant={variant} />
        <main className="flex-1">{children}</main>
        <Footer variant={variant} />
        <AuthModal
          key={`${authOpen}-${authTab}`}
          isOpen={authOpen}
          onClose={() => setAuthOpen(false)}
          defaultTab={authTab}
        />
      </div>
    </OpenAuthContextProvider>
  );
}
