import type { Metadata } from 'next';

import { PrivacyPage } from '@/features/marketing/pages/privacy-page';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How KanooniBaat collects, uses, and protects your personal data. DPDP-aligned privacy policy for users in India.',
  openGraph: {
    title: 'Privacy Policy | KanooniBaat',
    description: 'How we handle your data — transparency, control, and security.',
  },
};

export default function Page() {
  return <PrivacyPage />;
}
