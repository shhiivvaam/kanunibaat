import { I18nManager, Platform } from 'react-native';

const RTL_LOCALES = ['ur', 'ar'] as const;

export function isRtlLocale(locale: string): boolean {
  return (RTL_LOCALES as readonly string[]).includes(locale);
}

export function maybeEnableRtl(opts: { locale: string; enabled: boolean }) {
  if (!opts.enabled) return;
  if (Platform.OS === 'web') return;
  const shouldRtl = isRtlLocale(opts.locale);
  if (I18nManager.isRTL === shouldRtl) return;

  // NOTE: changing RTL at runtime requires an app reload to fully apply.
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(shouldRtl);
}
