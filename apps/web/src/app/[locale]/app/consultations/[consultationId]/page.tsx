import Link from 'next/link';

import { ConsultationChat } from '@/features/consultations/consultation-chat';
import { ConsultationDetails } from '@/features/consultations/consultation-details';

export default function ConsultationDetailPage({ params }: { params: { consultationId: string } }) {
  return (
    <div className="space-y-6">
      <Link
        href="/app/consultations"
        className="inline-block text-sm font-semibold text-[#C2410C] hover:underline"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        ← Back
      </Link>
      <ConsultationDetails consultationId={params.consultationId} />
      <ConsultationChat consultationId={params.consultationId} />
    </div>
  );
}
