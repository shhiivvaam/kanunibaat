import { RightsDetail } from '@/features/content/rights-detail';

export default async function RightsDetailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <RightsDetail slug={slug} />
    </div>
  );
}

