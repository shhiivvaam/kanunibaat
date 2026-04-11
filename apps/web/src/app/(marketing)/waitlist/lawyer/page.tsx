import type { Metadata } from 'next';

import { WaitlistLawyerPage } from '@/features/marketing/pages/waitlist-lawyer-page';

export const metadata: Metadata = {
  title: 'Lawyer waitlist',
  description: 'Early access for verified advocates — KanooniBaat lawyer onboarding and verification.',
  robots: { index: true, follow: true },
};

export default function Page() {
  return <WaitlistLawyerPage />;
}
