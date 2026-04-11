import type { Metadata } from 'next';

import { WaitlistUserPage } from '@/features/marketing/pages/waitlist-user-page';

export const metadata: Metadata = {
  title: 'App waitlist',
  description: 'Join the KanooniBaat app waitlist — early access for legal help in plain language, in India.',
  robots: { index: true, follow: true },
};

export default function Page() {
  return <WaitlistUserPage />;
}
