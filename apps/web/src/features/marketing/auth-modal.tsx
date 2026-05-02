'use client';

import { X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import type { AuthTab } from '@/features/marketing/open-auth-context';
import { authClient } from '@/lib/auth-client';

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: AuthTab;
};

type AuthMode = 'password' | 'email-otp' | 'phone-otp';

export function AuthModal({ isOpen, onClose, defaultTab = 'login' }: AuthModalProps) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const errorId = useId();

  const [tab, setTab] = useState<AuthTab>(defaultTab);
  const [mode, setMode] = useState<AuthMode>('password');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTab(defaultTab);
      setError(null);
    }
  }, [isOpen, defaultTab]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>('input,button')?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [isOpen, mode, tab]);

  const finishAuth = useCallback(() => {
    onClose();
    router.push('/app');
    router.refresh();
  }, [onClose, router]);

  const mapErr = (e: unknown): string => {
    if (
      e &&
      typeof e === 'object' &&
      'message' in e &&
      typeof (e as { message: unknown }).message === 'string'
    ) {
      return (e as { message: string }).message;
    }
    return 'Something went wrong. Try again.';
  };

  if (!isOpen) return null;

  const isLawyerTab = tab === 'signup';

  async function onPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (tab === 'login') {
        const { error: err } = await authClient.signIn.email({ email, password });
        if (err) {
          setError(err.message ?? 'Sign-in failed.');
          return;
        }
        finishAuth();
        return;
      }
      const { error: err } = await authClient.signUp.email({
        email,
        password,
        name: name.trim() || email.split('@')[0] || 'User',
      });
      if (err) {
        setError(err.message ?? 'Sign-up failed.');
        return;
      }
      finishAuth();
    } catch (caught) {
      setError(mapErr(caught));
    } finally {
      setPending(false);
    }
  }

  async function onSendEmailOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const { error: err } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: 'sign-in',
      });
      if (err) {
        setError(err.message ?? 'Could not send code.');
        return;
      }
    } catch (caught) {
      setError(mapErr(caught));
    } finally {
      setPending(false);
    }
  }

  async function onVerifyEmailOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const { error: err } = await authClient.signIn.emailOtp({
        email,
        otp,
        name: name.trim() || undefined,
      });
      if (err) {
        setError(err.message ?? 'Invalid code.');
        return;
      }
      finishAuth();
    } catch (caught) {
      setError(mapErr(caught));
    } finally {
      setPending(false);
    }
  }

  async function onSendPhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const { error: err } = await authClient.phoneNumber.sendOtp({ phoneNumber: phone });
      if (err) {
        setError(err.message ?? 'Could not send SMS.');
        return;
      }
    } catch (caught) {
      setError(mapErr(caught));
    } finally {
      setPending(false);
    }
  }

  async function onVerifyPhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const { error: err } = await authClient.phoneNumber.verify({
        phoneNumber: phone,
        code: otp,
      });
      if (err) {
        setError(err.message ?? 'Invalid code.');
        return;
      }
      finishAuth();
    } catch (caught) {
      setError(mapErr(caught));
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(28,25,23,0.5)', backdropFilter: 'blur(4px)' }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div
        ref={panelRef}
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[24px] bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={error ? errorId : undefined}
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
                id={titleId}
                className="text-[#1C1917]"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '18px' }}
              >
                Sign in to Jurisly
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

          <div className="flex rounded-[12px] border border-[#E7E5E4] bg-[#FAFAF9] p-1">
            {(['login', 'signup'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTab(t);
                  setError(null);
                }}
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

          <div className="mt-4 flex flex-wrap gap-2">
            {(['password', 'email-otp', 'phone-otp'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className="rounded-full border px-3 py-1 text-xs"
                style={{
                  fontFamily: 'var(--font-body)',
                  borderColor: mode === m ? '#C2410C' : '#E7E5E4',
                  background: mode === m ? '#FFF7ED' : 'white',
                  color: mode === m ? '#9a3409' : '#57534E',
                  fontWeight: mode === m ? 600 : 400,
                }}
              >
                {m === 'password'
                  ? 'Email & password'
                  : m === 'email-otp'
                    ? 'Email code'
                    : 'Phone code'}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 px-8 py-6">
          {error ? (
            <p
              id={errorId}
              className="text-sm text-red-700"
              role="alert"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {error}
            </p>
          ) : null}

          {mode === 'password' ? (
            <form className="space-y-3" onSubmit={onPasswordSubmit}>
              {tab === 'signup' ? (
                <label className="block">
                  <span
                    className="mb-1 block text-xs font-medium text-[#57534E]"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    Name
                  </span>
                  <input
                    className="h-11 w-full rounded-[12px] border border-[#E7E5E4] px-3 text-sm outline-none ring-[#C2410C] focus:ring-2"
                    value={name}
                    onChange={(ev) => setName(ev.target.value)}
                    autoComplete="name"
                    required
                  />
                </label>
              ) : null}
              <label className="block">
                <span
                  className="mb-1 block text-xs font-medium text-[#57534E]"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Email
                </span>
                <input
                  className="h-11 w-full rounded-[12px] border border-[#E7E5E4] px-3 text-sm outline-none ring-[#C2410C] focus:ring-2"
                  type="email"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  autoComplete="email"
                  required
                />
              </label>
              <label className="block">
                <span
                  className="mb-1 block text-xs font-medium text-[#57534E]"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Password
                </span>
                <input
                  className="h-11 w-full rounded-[12px] border border-[#E7E5E4] px-3 text-sm outline-none ring-[#C2410C] focus:ring-2"
                  type="password"
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                  required
                  minLength={8}
                />
              </label>
              <button
                type="submit"
                disabled={pending}
                className="flex h-12 w-full items-center justify-center rounded-[16px] bg-[#C2410C] text-sm font-semibold text-white transition-colors hover:bg-[#9a3409] disabled:opacity-60"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {pending ? 'Please wait…' : tab === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>
          ) : null}

          {mode === 'email-otp' ? (
            <div className="space-y-4">
              {tab === 'signup' ? (
                <label className="block">
                  <span
                    className="mb-1 block text-xs font-medium text-[#57534E]"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    Name (for new accounts)
                  </span>
                  <input
                    className="h-11 w-full rounded-[12px] border border-[#E7E5E4] px-3 text-sm outline-none ring-[#C2410C] focus:ring-2"
                    value={name}
                    onChange={(ev) => setName(ev.target.value)}
                    autoComplete="name"
                  />
                </label>
              ) : null}
              <form className="space-y-3" onSubmit={onSendEmailOtp}>
                <label className="block">
                  <span
                    className="mb-1 block text-xs font-medium text-[#57534E]"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    Email
                  </span>
                  <input
                    className="h-11 w-full rounded-[12px] border border-[#E7E5E4] px-3 text-sm outline-none ring-[#C2410C] focus:ring-2"
                    type="email"
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                    required
                  />
                </label>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex h-11 w-full items-center justify-center rounded-[14px] border border-[#E7E5E4] text-sm font-semibold text-[#1C1917] hover:bg-[#FAFAF9] disabled:opacity-60"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Send code
                </button>
              </form>
              <form className="space-y-3" onSubmit={onVerifyEmailOtp}>
                <label className="block">
                  <span
                    className="mb-1 block text-xs font-medium text-[#57534E]"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    Verification code
                  </span>
                  <input
                    className="h-11 w-full rounded-[12px] border border-[#E7E5E4] px-3 text-sm outline-none ring-[#C2410C] focus:ring-2"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(ev) => setOtp(ev.target.value)}
                    required
                  />
                </label>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex h-12 w-full items-center justify-center rounded-[16px] bg-[#1C1917] text-sm font-semibold text-white hover:bg-[#292524] disabled:opacity-60"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {pending ? 'Verifying…' : 'Verify & continue'}
                </button>
              </form>
            </div>
          ) : null}

          {mode === 'phone-otp' ? (
            <div className="space-y-4">
              <p
                className="text-xs text-[#78716C]"
                style={{ fontFamily: 'var(--font-body)', lineHeight: 1.5 }}
              >
                Use your full number with country code (for example +9198…). SMS is sent via MSG91
                when configured.
              </p>
              <form className="space-y-3" onSubmit={onSendPhoneOtp}>
                <label className="block">
                  <span
                    className="mb-1 block text-xs font-medium text-[#57534E]"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    Phone
                  </span>
                  <input
                    className="h-11 w-full rounded-[12px] border border-[#E7E5E4] px-3 text-sm outline-none ring-[#C2410C] focus:ring-2"
                    type="tel"
                    value={phone}
                    onChange={(ev) => setPhone(ev.target.value)}
                    autoComplete="tel"
                    required
                  />
                </label>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex h-11 w-full items-center justify-center rounded-[14px] border border-[#E7E5E4] text-sm font-semibold text-[#1C1917] hover:bg-[#FAFAF9] disabled:opacity-60"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Send SMS code
                </button>
              </form>
              <form className="space-y-3" onSubmit={onVerifyPhoneOtp}>
                <label className="block">
                  <span
                    className="mb-1 block text-xs font-medium text-[#57534E]"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    SMS code
                  </span>
                  <input
                    className="h-11 w-full rounded-[12px] border border-[#E7E5E4] px-3 text-sm outline-none ring-[#C2410C] focus:ring-2"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={otp}
                    onChange={(ev) => setOtp(ev.target.value)}
                    required
                  />
                </label>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex h-12 w-full items-center justify-center rounded-[16px] bg-[#C2410C] text-sm font-semibold text-white hover:bg-[#9a3409] disabled:opacity-60"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {pending ? 'Verifying…' : 'Verify & continue'}
                </button>
              </form>
            </div>
          ) : null}

          {isLawyerTab ? (
            <p
              className="text-center text-xs text-[#78716C]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Full lawyer verification and workspace live on a separate portal in a later milestone.{' '}
              <Link
                href="/waitlist/lawyer"
                className="text-[#C2410C] hover:underline"
                onClick={onClose}
              >
                Join the lawyer waitlist
              </Link>
            </p>
          ) : null}

          <p
            className="text-center text-xs text-[#78716C]"
            style={{ fontFamily: 'var(--font-body)' }}
          >
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
