import type { Metadata } from 'next';

import { TermsPage } from '@/features/marketing/pages/terms-page';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Terms governing your use of Jurisly — informational tools, lawyer marketplace, and acceptable use.',
  openGraph: {
    title: 'Terms of Service | Jurisly',
    description: 'Legal terms for using Jurisly services.',
  },
};

export default function Page() {
  return <TermsPage />;
}
