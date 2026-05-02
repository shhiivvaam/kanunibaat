'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { trpc } from '@jurisly/api-client';

import { defaultLocale, locales, type Locale } from '@/i18n/routing';

const LOCALE_LABEL: Record<Locale, string> = {
  en: 'English',
  hi: 'हिन्दी',
  ta: 'தமிழ்',
  te: 'తెలుగు',
  kn: 'ಕನ್ನಡ',
  mr: 'मराठी',
  gu: 'ગુજરાતી',
  bn: 'বাংলা',
};

function stripLeadingLocale(pathname: string): { locale: string | null; rest: string } {
  const parts = pathname.split('/').filter(Boolean);
  const maybe = parts[0] ?? null;
  if (maybe && (locales as readonly string[]).includes(maybe)) {
    const restParts = parts.slice(1);
    return { locale: maybe, rest: `/${restParts.join('/')}`.replace(/\/$/, '') || '/' };
  }
  return { locale: null, rest: pathname };
}

function setNextIntlLocaleCookie(locale: string) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `NEXT_LOCALE=${encodeURIComponent(locale)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function LanguageSwitcher(props: { compact?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const { rest } = useMemo(() => stripLeadingLocale(pathname), [pathname]);
  const [value, setValue] = useState<Locale>(
    (locales as readonly string[]).includes(locale) ? (locale as Locale) : defaultLocale,
  );

  const updateProfile = trpc.profile.update.useMutation();

  async function onChange(next: Locale) {
    setValue(next);
    setNextIntlLocaleCookie(next);
    try {
      await updateProfile.mutateAsync({ locale: next });
    } catch {
      // anonymous: cookie-only
    }
    router.push(`/${next}${rest}`);
  }

  return (
    <label className="flex items-center gap-2 text-xs text-[#78716C]">
      {!props.compact ? <span className="hidden sm:inline">Lang</span> : null}
      <select
        className="rounded-lg border border-[#E7E5E4] bg-white px-2 py-1 text-xs text-[#1C1917]"
        value={value}
        onChange={(e) => void onChange(e.target.value as Locale)}
        aria-label="Language"
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {LOCALE_LABEL[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
