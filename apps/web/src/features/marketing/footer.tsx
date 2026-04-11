import { Scale } from 'lucide-react';
import Link from 'next/link';

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-[#E7E5E4] bg-white">
      <div className="mx-auto max-w-[1200px] px-6 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C2410C]">
                <Scale size={16} color="white" />
              </div>
              <span
                className="text-[#1C1917]"
                style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '18px' }}
              >
                KanooniBaat
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
              Making Indian law accessible to every citizen — in plain language, whenever you need it.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="#"
                aria-label="LinkedIn"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E7E5E4] text-[#78716C] transition-colors hover:border-[#C2410C] hover:text-[#C2410C]"
              >
                <LinkedInIcon className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Twitter / X"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E7E5E4] text-[#78716C] transition-colors hover:border-[#C2410C] hover:text-[#C2410C]"
              >
                <XIcon className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E7E5E4] text-[#78716C] transition-colors hover:border-[#C2410C] hover:text-[#C2410C]"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4
              className="mb-4 text-xs uppercase tracking-wider text-[#78716C]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
            >
              Company
            </h4>
            <ul className="space-y-3">
              {[
                { label: 'Features', href: '/features' },
                { label: 'For Lawyers', href: '/for-lawyers' },
                { label: 'How It Works', href: '/#how-it-works' },
                { label: 'Pricing', href: '/pricing' },
                { label: 'About Us', href: '/about' },
                { label: 'Blog & Updates', href: '/blog' },
                { label: 'Careers', href: '#' },
              ].map((item) => (
                <li key={item.label}>
                  {item.href.startsWith('/') ? (
                    <Link
                      href={item.href}
                      className="text-sm text-[#1C1917] transition-colors hover:text-[#C2410C]"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      href={item.href}
                      className="text-sm text-[#1C1917] transition-colors hover:text-[#C2410C]"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      {item.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4
              className="mb-4 text-xs uppercase tracking-wider text-[#78716C]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
            >
              Services
            </h4>
            <ul className="space-y-3">
              {[
                { label: 'Legal Q&A', href: '/legal-qa' },
                { label: 'Document Review', href: '/document-review' },
                { label: 'Lawyer Connect', href: '/lawyer-connect' },
                { label: 'Know Your Rights', href: '/know-your-rights' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#1C1917] transition-colors hover:text-[#C2410C]"
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4
              className="mb-4 text-xs uppercase tracking-wider text-[#78716C]"
              style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}
            >
              Contact
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:hello@kanoonibaat.in"
                  className="text-sm text-[#1C1917] transition-colors hover:text-[#C2410C]"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  hello@kanoonibaat.in
                </a>
              </li>
              <li>
                <p className="text-sm text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
                  Available in Hindi & English
                </p>
              </li>
              <li>
                <p className="text-sm text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
                  Mon–Sat, 9am–7pm IST
                </p>
              </li>
            </ul>
            <div className="mt-5 rounded-xl border border-[#FED7AA] bg-[#FFF7ED] p-3">
              <p className="text-xs text-[#C2410C]" style={{ fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                Proudly made in India
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#E7E5E4]">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 px-6 py-4 sm:flex-row">
          <p className="text-xs text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
            © 2026 KanooniBaat. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link
              href="/privacy"
              className="text-xs text-[#78716C] transition-colors hover:text-[#C2410C]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-[#78716C] transition-colors hover:text-[#C2410C]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy-charter"
              className="text-xs text-[#78716C] transition-colors hover:text-[#C2410C]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Privacy Charter
            </Link>
            <Link
              href="/privacy#cookies"
              className="text-xs text-[#78716C] transition-colors hover:text-[#C2410C]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
