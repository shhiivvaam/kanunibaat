import type { Metadata } from 'next';

import { PrivacyCharterPage } from '@/features/marketing/pages/privacy-charter-page';

export const metadata: Metadata = {
  title: 'Privacy Charter',
  description:
    'Jurisly’s public pledge: your data, transparency, security, and respect — in plain language.',
  openGraph: {
    title: 'Privacy Charter | Jurisly',
    description: 'Our public commitments on privacy and trust.',
  },
};

export default function Page() {
  return <PrivacyCharterPage />;
}
