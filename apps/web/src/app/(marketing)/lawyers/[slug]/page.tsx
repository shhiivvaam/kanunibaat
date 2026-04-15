import type { Metadata } from 'next';

import { LawyerPublicProfile } from '@/features/lawyers/lawyer-public-profile';
import { createServerTrpc } from '@/lib/server-trpc';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  try {
    const trpc = await createServerTrpc();
    const res = await trpc.marketplace.lawyerBySlug.query({ slug });
    const law = res.lawyer;
    if (!law) {
      return { title: 'Lawyer not found' };
    }
    const title = law.displayName ?? 'Verified lawyer';
    return {
      title,
      description: law.headline || `Verified advocate on KanuniBaat${law.city ? ` — ${law.city}` : ''}.`,
      openGraph: {
        title: `${title} | KanuniBaat`,
        description: law.headline || 'Verified lawyer profile on KanuniBaat.',
      },
    };
  } catch {
    return { title: 'Lawyer profile' };
  }
}

export default async function LawyerSlugPage(props: Props) {
  const { slug } = await props.params;
  return (
    <div className="mx-auto max-w-[800px] px-6 py-16">
      <LawyerPublicProfile slug={slug} />
    </div>
  );
}
