import type { Metadata } from 'next';

import { ForLawyersPage } from '@/features/marketing/pages/for-lawyers-page';

export const metadata: Metadata = {
  title: 'For Lawyers',
  description:
    'Grow your practice with KanooniBaat — verified profiles, case management, AI research, and fair client discovery for Indian advocates.',
  openGraph: {
    title: 'For Lawyers | KanooniBaat',
    description: 'Practice tools and pricing for verified advocates on KanooniBaat.',
  },
};

export default function Page() {
  return <ForLawyersPage />;
}
