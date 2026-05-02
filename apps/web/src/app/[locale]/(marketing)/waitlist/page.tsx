import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

import { WaitlistUserPage } from '@/features/marketing/pages/waitlist-user-page';
import { defaultLocale } from '@/i18n/routing';
import { isWaitlistCampaign } from '@/lib/marketing-campaign';

export const metadata: Metadata = {
  title: 'App waitlist',
  description:
    'Join the Jurisly app waitlist — early access for legal help in plain language, in India.',
  robots: { index: true, follow: true },
};

export default function Page() {
  if (isWaitlistCampaign()) {
    permanentRedirect(`/${defaultLocale}`);
  }
  return <WaitlistUserPage />;
}
