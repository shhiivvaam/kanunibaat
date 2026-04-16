import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import en from './translations/en.json';
import hi from './translations/hi.json';
import ta from './translations/ta.json';
import te from './translations/te.json';
import kn from './translations/kn.json';
import mr from './translations/mr.json';
import gu from './translations/gu.json';
import bn from './translations/bn.json';
import { maybeEnableRtl } from './rtl';

export const mobileLocales = ['en', 'hi', 'ta', 'te', 'kn', 'mr', 'gu', 'bn'] as const;
export type MobileLocale = (typeof mobileLocales)[number];

const translations: Record<MobileLocale, Record<string, unknown>> = {
  en,
  hi,
  ta,
  te,
  kn,
  mr,
  gu,
  bn,
};

function resolveDeviceLocale(): MobileLocale {
  const device = Localization.getLocales()?.[0];
  const code = device?.languageCode?.toLowerCase() ?? 'en';
  return (mobileLocales as readonly string[]).includes(code) ? (code as MobileLocale) : 'en';
}

function createI18n(locale: MobileLocale) {
  const i18n = new I18n(translations);
  i18n.enableFallback = true;
  i18n.defaultLocale = 'en';
  i18n.locale = locale;
  return i18n;
}

type I18nCtx = {
  locale: MobileLocale;
  setLocale: (next: MobileLocale) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
};

const I18nContext = createContext<I18nCtx | null>(null);

export function I18nProvider(props: { children: React.ReactNode; initialLocale?: MobileLocale }) {
  const [locale, setLocale] = useState<MobileLocale>(() => props.initialLocale ?? resolveDeviceLocale());

  useEffect(() => {
    maybeEnableRtl({ locale, enabled: process.env.EXPO_PUBLIC_RTL_ENABLED === 'true' });
  }, [locale]);

  const i18n = useMemo(() => createI18n(locale), [locale]);
  const value = useMemo<I18nCtx>(
    () => ({
      locale,
      setLocale,
      t: (key, options) => i18n.t(key, options),
    }),
    [i18n, locale],
  );

  return <I18nContext.Provider value={value}>{props.children}</I18nContext.Provider>;
}

export function useLocale(): MobileLocale {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useLocale must be used within I18nProvider');
  return ctx.locale;
}

export function useSetLocale(): (next: MobileLocale) => void {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useSetLocale must be used within I18nProvider');
  return ctx.setLocale;
}

export function useT(): (key: string, options?: Record<string, unknown>) => string {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useT must be used within I18nProvider');
  return ctx.t;
}

