import type { Metadata } from 'next';

import { FeaturesPage } from '@/features/marketing/pages/features-page';

export const metadata: Metadata = {
  title: 'Features',
  description:
    'Notice Scanner, emergency legal guide, lawyer marketplace, document vault, and practice tools — KanooniBaat for India.',
  openGraph: {
    title: 'Features | KanooniBaat',
    description: 'How KanooniBaat helps citizens and lawyers navigate Indian law.',
  },
};

export default function Page() {
  return <FeaturesPage />;
}
