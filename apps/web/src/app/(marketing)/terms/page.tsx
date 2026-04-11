import type { Metadata } from 'next';

import { TermsPage } from '@/features/marketing/pages/terms-page';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Terms governing your use of KanooniBaat — informational tools, lawyer marketplace, and acceptable use.',
  openGraph: {
    title: 'Terms of Service | KanooniBaat',
    description: 'Legal terms for using KanooniBaat services.',
  },
};

export default function Page() {
  return <TermsPage />;
}
