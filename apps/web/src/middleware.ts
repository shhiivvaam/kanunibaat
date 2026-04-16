import createMiddleware from 'next-intl/middleware';

import { defaultLocale, locales } from './i18n/routing';

export default createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
});

export const config = {
  // Exclude Next internals, static assets, and Sentry tunnel route.
  matcher: ['/((?!_next|.*\\..*|monitoring).*)'],
};

