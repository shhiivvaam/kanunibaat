import Link from 'next/link';

import { ConsultationsList } from '@/features/consultations/consultations-list';

export default function ConsultationsPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-display)' }}>
            Consultations
          </h1>
          <p className="mt-1 text-sm text-[#57534E]" style={{ fontFamily: 'var(--font-body)' }}>
            Your bookings and ongoing chats.
          </p>
        </div>
        <Link
          href="/lawyers"
          className="rounded-xl border border-[#E7E5E4] bg-white px-4 py-2 text-sm font-semibold text-[#44403C] hover:bg-[#FAFAF9]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Find a lawyer
        </Link>
      </header>

      <ConsultationsList />
    </div>
  );
}

