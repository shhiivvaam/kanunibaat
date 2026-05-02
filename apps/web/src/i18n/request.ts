import { getRequestConfig } from 'next-intl/server';

import { defaultLocale, locales } from './routing';

export default getRequestConfig(async ({ locale }) => {
  const resolved = locales.includes(locale as unknown as (typeof locales)[number])
    ? (locale as string)
    : defaultLocale;
  return {
    locale: resolved,
    messages: (await import(`../messages/${resolved}.json`)).default,
  };
});
