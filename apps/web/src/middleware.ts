import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

import { defaultLocale, locales } from './i18n/routing';

const intlMiddleware = createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
});

const LEGAL_MARKETING_PAGES = new Set(['privacy', 'terms', 'privacy-charter']);

function isWaitlistCampaignEnv(): boolean {
  return process.env.NEXT_PUBLIC_MARKETING_CAMPAIGN?.trim().toLowerCase() === 'waitlist';
}

function isAllowedWaitlistMarketingRest(restSegments: string[]): boolean {
  if (restSegments.length === 0) return true;
  const joined = restSegments.join('/');
  if (joined === 'waitlist/lawyer') return true;
  if (restSegments.length === 1 && LEGAL_MARKETING_PAGES.has(restSegments[0] ?? '')) return true;
  if (restSegments[0] === 'app') return true;
  if (restSegments[0] === 'vault' && restSegments[1] === 'shared' && restSegments.length >= 3)
    return true;
  return false;
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/monitoring')
  ) {
    return NextResponse.next();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const intlResponse = intlMiddleware(request as any);

  if (!isWaitlistCampaignEnv()) {
    return intlResponse;
  }

  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse;
  }

  const segments = pathname.split('/').filter(Boolean);
  const maybeLocale = segments[0];
  if (!maybeLocale || !(locales as readonly string[]).includes(maybeLocale)) {
    return intlResponse;
  }

  const rest = segments.slice(1);
  if (isAllowedWaitlistMarketingRest(rest)) {
    return intlResponse;
  }

  const url = request.nextUrl.clone();
  url.pathname = `/${maybeLocale}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next|.*\\..*|monitoring).*)'],
};
