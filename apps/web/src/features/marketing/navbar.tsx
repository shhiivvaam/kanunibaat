'use client';

import { ChevronDown, Menu, Scale, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const services = [
  { name: 'Legal Q&A', href: '/legal-qa', desc: 'Ask any legal question' },
  { name: 'Document Review', href: '/document-review', desc: 'Upload & understand contracts' },
  { name: 'Lawyer Connect', href: '/lawyer-connect', desc: 'Find verified lawyers' },
  { name: 'Know Your Rights', href: '/know-your-rights', desc: 'Understand your legal rights' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setMobileOpen(false);
        setServicesOpen(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setServicesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <nav
        className="sticky top-0 z-40 w-full border-b border-[#E7E5E4] bg-white"
        style={{ height: '64px' }}
      >
        <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C2410C]">
              <Scale size={16} color="white" />
            </div>
            <span
              className="text-[#1C1917]"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '20px' }}
            >
              KanooniBaat
            </span>
          </Link>

          <div className="hidden items-center gap-6 lg:flex xl:gap-8">
            <Link
              href="/features"
              className="text-sm transition-colors"
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                color: isActive('/features') ? '#C2410C' : '#78716C',
                textDecoration: isActive('/features') ? 'underline' : 'none',
              }}
            >
              Features
            </Link>
            <Link
              href="/for-lawyers"
              className="text-sm transition-colors"
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                color: isActive('/for-lawyers') ? '#C2410C' : '#78716C',
                textDecoration: isActive('/for-lawyers') ? 'underline' : 'none',
              }}
            >
              For Lawyers
            </Link>
            <Link
              href="/lawyers"
              className="text-sm transition-colors"
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                color: isActive('/lawyers') ? '#C2410C' : '#78716C',
                textDecoration: isActive('/lawyers') ? 'underline' : 'none',
              }}
            >
              Find lawyers
            </Link>
            <Link
              href="/#how-it-works"
              className="text-sm text-[#78716C] transition-colors hover:text-[#C2410C]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
            >
              How It Works
            </Link>

            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setServicesOpen(!servicesOpen)}
                className="flex items-center gap-1 text-sm text-[#78716C] transition-colors hover:text-[#C2410C]"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
                aria-expanded={servicesOpen}
                aria-haspopup="true"
              >
                Services
                <ChevronDown
                  size={14}
                  style={{
                    transform: servicesOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 150ms',
                  }}
                />
              </button>
              {servicesOpen && (
                <div className="absolute left-1/2 top-full mt-3 w-64 -translate-x-1/2 overflow-hidden rounded-[16px] border border-[#E7E5E4] bg-white shadow-lg">
                  {services.map((s) => (
                    <Link
                      key={s.href}
                      href={s.href}
                      className="group flex flex-col px-4 py-3 transition-colors hover:bg-[#FFF7ED]"
                    >
                      <span
                        className="text-sm text-[#1C1917] transition-colors group-hover:text-[#C2410C]"
                        style={{ fontWeight: 600 }}
                      >
                        {s.name}
                      </span>
                      <span className="mt-0.5 text-xs text-[#78716C]">{s.desc}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/pricing"
              className="text-sm transition-colors"
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                color: isActive('/pricing') ? '#C2410C' : '#78716C',
                textDecoration: isActive('/pricing') ? 'underline' : 'none',
              }}
            >
              Pricing
            </Link>

            <Link
              href="/about"
              className="text-sm transition-colors"
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                color: isActive('/about') ? '#C2410C' : '#78716C',
                textDecoration: isActive('/about') ? 'underline' : 'none',
              }}
            >
              About
            </Link>
            <Link
              href="/blog"
              className="text-sm transition-colors"
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                color: pathname.startsWith('/blog') ? '#C2410C' : '#78716C',
                textDecoration: pathname.startsWith('/blog') ? 'underline' : 'none',
              }}
            >
              Blog
            </Link>
          </div>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/waitlist/lawyer"
              className="h-11 rounded-[16px] border border-[#1C1917] px-5 text-sm leading-[44px] text-[#1C1917] transition-all duration-150 hover:bg-[#1C1917] hover:text-white active:scale-[0.97]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
            >
              For lawyers
            </Link>
            <Link
              href="/waitlist"
              className="h-11 rounded-[16px] bg-[#C2410C] px-5 text-sm leading-[44px] text-white transition-all duration-150 hover:bg-[#9a3409] active:scale-[0.97]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
            >
              Join waitlist
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-[#1C1917] transition-colors hover:bg-[#FFF7ED] lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-white"
          style={{ top: '64px', animation: 'fadeIn 200ms ease-out' }}
        >
          <div className="space-y-2 p-6">
            <Link
              href="/features"
              className="block rounded-xl px-4 py-3 text-base text-[#1C1917] hover:bg-[#FFF7ED]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
            >
              Features
            </Link>
            <Link
              href="/for-lawyers"
              className="block rounded-xl px-4 py-3 text-base text-[#1C1917] hover:bg-[#FFF7ED]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
            >
              For Lawyers
            </Link>
            <Link
              href="/lawyers"
              className="block rounded-xl px-4 py-3 text-base text-[#1C1917] hover:bg-[#FFF7ED]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
            >
              Find lawyers
            </Link>
            <Link
              href="/#how-it-works"
              className="block rounded-xl px-4 py-3 text-base text-[#1C1917] hover:bg-[#FFF7ED]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
            >
              How It Works
            </Link>

            <div className="px-4 py-3">
              <p
                className="mb-2 text-xs uppercase tracking-wide text-[#78716C]"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
              >
                Services
              </p>
              {services.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  className="block py-2 pl-2 text-[15px] text-[#1C1917] transition-colors hover:text-[#C2410C]"
                  style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
                >
                  {s.name}
                </Link>
              ))}
            </div>

            <Link
              href="/pricing"
              className="block rounded-xl px-4 py-3 text-base text-[#1C1917] hover:bg-[#FFF7ED]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
            >
              Pricing
            </Link>

            <Link
              href="/about"
              className="block rounded-xl px-4 py-3 text-base text-[#1C1917] hover:bg-[#FFF7ED]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
            >
              About
            </Link>
            <Link
              href="/blog"
              className="block rounded-xl px-4 py-3 text-base text-[#1C1917] hover:bg-[#FFF7ED]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
            >
              Blog
            </Link>

            <div className="mt-4 space-y-3 border-t border-[#E7E5E4] pt-4">
              <Link
                href="/waitlist/lawyer"
                onClick={() => setMobileOpen(false)}
                className="flex h-12 w-full items-center justify-center rounded-[16px] border border-[#1C1917] text-base text-[#1C1917]"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 500 }}
              >
                Lawyer waitlist
              </Link>
              <Link
                href="/waitlist"
                onClick={() => setMobileOpen(false)}
                className="flex h-12 w-full items-center justify-center rounded-[16px] bg-[#C2410C] text-base text-white"
                style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
              >
                Join app waitlist
              </Link>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
}
