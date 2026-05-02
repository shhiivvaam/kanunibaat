import type { Metadata } from 'next';

import { ForLawyersPage } from '@/features/marketing/pages/for-lawyers-page';

export const metadata: Metadata = {
  title: 'For Lawyers',
  description:
    'Grow your practice with Jurisly — verified profiles, case management, AI research, and fair client discovery for Indian advocates.',
  openGraph: {
    title: 'For Lawyers | Jurisly',
    description: 'Practice tools and pricing for verified advocates on Jurisly.',
  },
};

export default function Page() {
  return <ForLawyersPage />;
}
