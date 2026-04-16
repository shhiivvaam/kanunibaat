export const locales = ['en', 'hi', 'ta', 'te', 'kn', 'mr', 'gu', 'bn'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const rtlLocales = ['ur', 'ar'] as const;

export const rtlEnabled = process.env.NEXT_PUBLIC_RTL_ENABLED === 'true';
export function isRtlLocale(locale: string): boolean {
  if (!rtlEnabled) return false;
  return (rtlLocales as readonly string[]).includes(locale);
}

