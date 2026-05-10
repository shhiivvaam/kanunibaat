import Link from 'next/link';
import { redirect } from 'next/navigation';

import { createServerTrpc } from '@/lib/server-trpc';

export default async function AdminSectionLayout({ children }: { children: React.ReactNode }) {
  const trpc = await createServerTrpc();
  try {
    const profile = await trpc.profile.me.query();
    if (!profile.roles.includes('admin')) {
      redirect('/app');
    }
  } catch {
    redirect('/');
  }

  return (
    <div className="space-y-8">
      <nav
        className="flex flex-wrap gap-4 border-b border-[#E7E5E4] pb-4 text-sm"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        <Link href="/app/admin" className="font-semibold text-[#C2410C]">
          Verification queue
        </Link>
        <Link href="/app" className="text-[#57534E] hover:text-[#C2410C]">
          Account home
        </Link>
        <Link href="/lawyers" className="text-[#57534E] hover:text-[#C2410C]">
          Public directory
        </Link>
      </nav>
      {children}
    </div>
  );
}
