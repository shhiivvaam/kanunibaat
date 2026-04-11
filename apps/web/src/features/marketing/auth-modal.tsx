'use client';

import { X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import type { AuthTab } from '@/features/marketing/open-auth-context';

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: AuthTab;
};

export function AuthModal({ isOpen, onClose, defaultTab = 'login' }: AuthModalProps) {
  const [tab, setTab] = useState<AuthTab>(defaultTab);

  if (!isOpen) {
    return null;
  }

  const isLawyer = tab === 'signup';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(28,25,23,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-[24px] bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <div className="border-b border-[#E7E5E4] px-8 pb-6 pt-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C2410C]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M12 2L4 7V17L12 22L20 17V7L12 2Z"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  <path d="M8 12H16M12 8V16" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <span
                id="auth-modal-title"
                className="text-[#1C1917]"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '18px' }}
              >
                KanooniBaat
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#78716C] transition-colors hover:bg-[#FFF7ED] hover:text-[#C2410C]"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          <p className="mb-4 text-sm text-[#57534E]" style={{ fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
            Full sign-in with phone OTP and verified accounts is coming in the next release. For now, join a waitlist and
            we will notify you as soon as your access is ready.
          </p>

          <div className="flex rounded-[12px] border border-[#E7E5E4] bg-[#FAFAF9] p-1">
            {(['login', 'signup'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className="flex-1 rounded-[10px] py-2 text-sm transition-all duration-150"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: tab === t ? 600 : 400,
                  background: tab === t ? '#C2410C' : 'transparent',
                  color: tab === t ? 'white' : '#78716C',
                }}
              >
                {t === 'login' ? 'I need legal help' : 'I am a lawyer'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 px-8 py-6">
          {isLawyer ? (
            <>
              <p className="text-sm text-[#57534E]" style={{ fontFamily: 'var(--font-body)', lineHeight: 1.65 }}>
                Get early access to the advocate workspace — verification, discovery, and practice tools.
              </p>
              <Link
                href="/waitlist/lawyer"
                onClick={onClose}
                className="flex h-12 w-full items-center justify-center rounded-[16px] bg-[#1C1917] text-sm font-semibold text-white transition-colors hover:bg-[#292524]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Join lawyer waitlist
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-[#57534E]" style={{ fontFamily: 'var(--font-body)', lineHeight: 1.65 }}>
                Be first in line for the mobile app — notice scanner, emergency guide, and lawyer connect.
              </p>
              <Link
                href="/waitlist"
                onClick={onClose}
                className="flex h-12 w-full items-center justify-center rounded-[16px] bg-[#C2410C] text-sm font-semibold text-white transition-colors hover:bg-[#9a3409]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Join app waitlist
              </Link>
            </>
          )}
          <p className="text-center text-xs text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
            <Link href="/terms" className="text-[#C2410C] hover:underline" onClick={onClose}>
              Terms of Service
            </Link>
            {' · '}
            <Link href="/privacy" className="text-[#C2410C] hover:underline" onClick={onClose}>
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
