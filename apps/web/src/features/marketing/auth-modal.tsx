'use client';

import { Eye, EyeOff, X } from 'lucide-react';
import { useState } from 'react';

import type { AuthTab } from '@/features/marketing/open-auth-context';

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: AuthTab;
};

export function AuthModal({ isOpen, onClose, defaultTab = 'login' }: AuthModalProps) {
  const [tab, setTab] = useState<AuthTab>(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

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
                  transform: tab === t ? 'scale(1)' : 'scale(0.98)',
                }}
              >
                {t === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-8 py-6">
          {tab === 'signup' && (
            <div>
              <label
                className="mb-1.5 block text-sm text-[#1C1917]"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
              >
                Full Name
              </label>
              <input
                type="text"
                placeholder="Rahul Sharma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-12 w-full rounded-[12px] border border-[#E7E5E4] bg-white px-4 text-[#1C1917] outline-none transition-all placeholder:text-[#78716C]"
                style={{ fontFamily: 'var(--font-body)' }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#C2410C';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E7E5E4';
                }}
              />
            </div>
          )}

          <div>
            <label
              className="mb-1.5 block text-sm text-[#1C1917]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
            >
              Email Address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="h-12 w-full rounded-[12px] border border-[#E7E5E4] bg-white px-4 text-[#1C1917] outline-none transition-all placeholder:text-[#78716C]"
              style={{ fontFamily: 'var(--font-body)' }}
              onFocus={(e) => {
                e.target.style.borderColor = '#C2410C';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E7E5E4';
              }}
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm text-[#1C1917]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="h-12 w-full rounded-[12px] border border-[#E7E5E4] bg-white px-4 pr-12 text-[#1C1917] outline-none transition-all placeholder:text-[#78716C]"
                style={{ fontFamily: 'var(--font-body)' }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#C2410C';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E7E5E4';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] transition-colors hover:text-[#1C1917]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {tab === 'login' && (
            <div className="text-right">
              <button
                type="button"
                className="text-sm text-[#C2410C] hover:underline"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            className="mt-2 h-12 w-full rounded-[16px] bg-[#C2410C] text-white transition-all duration-100 hover:bg-[#9a3409] active:scale-[0.97]"
            style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '15px' }}
          >
            {tab === 'login' ? 'Log In' : 'Create Account'}
          </button>

          {tab === 'signup' && (
            <p className="mt-2 text-center text-xs text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
              By signing up, you agree to our{' '}
              <a href="#" className="text-[#C2410C] hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-[#C2410C] hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          )}
        </form>

        <div className="px-8 pb-8 text-center">
          <p className="text-sm text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
            {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => setTab(tab === 'login' ? 'signup' : 'login')}
              className="text-[#C2410C] hover:underline"
              style={{ fontWeight: 600 }}
            >
              {tab === 'login' ? 'Sign up free' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
