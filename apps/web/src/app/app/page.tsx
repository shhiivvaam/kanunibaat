'use client';

import { authClient } from '@/lib/auth-client';
import { trpc } from '@kb/api-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AppHomePage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const { data: profile, isPending: profilePending } = trpc.profile.me.useQuery(undefined, {
    enabled: Boolean(session?.user?.id),
  });

  async function onSignOut() {
    await authClient.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
          Your account
        </h1>
        <p className="mt-2 text-sm text-[#57534E]" style={{ fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
          Signed-in area for KanuniBaat. Profile data below comes from the Nest API via tRPC (same-origin proxy).
        </p>
      </div>

      <section className="rounded-2xl border border-[#E7E5E4] bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-body)' }}>
          Session
        </h2>
        {sessionPending ? (
          <p className="mt-2 text-sm text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
            Loading session…
          </p>
        ) : session?.user ? (
          <ul className="mt-3 space-y-1 text-sm text-[#57534E]" style={{ fontFamily: 'var(--font-body)' }}>
            <li>
              <span className="font-medium text-[#1C1917]">Email:</span> {session.user.email}
            </li>
            <li>
              <span className="font-medium text-[#1C1917]">Name:</span> {session.user.name}
            </li>
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[#78716C]">No session.</p>
        )}
        <button
          type="button"
          onClick={() => void onSignOut()}
          className="mt-4 rounded-xl bg-[#1C1917] px-4 py-2 text-sm font-semibold text-white hover:bg-[#292524]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Sign out
        </button>
      </section>

      <section className="rounded-2xl border border-[#E7E5E4] bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-[#1C1917]" style={{ fontFamily: 'var(--font-body)' }}>
          Profile (tRPC)
        </h2>
        {profilePending ? (
          <p className="mt-2 text-sm text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
            Loading profile…
          </p>
        ) : profile ? (
          <pre className="mt-3 overflow-x-auto rounded-xl bg-[#FAFAF9] p-3 text-xs text-[#44403C]">
            {JSON.stringify(profile, null, 2)}
          </pre>
        ) : (
          <p className="mt-2 text-sm text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
            Profile not loaded.
          </p>
        )}
      </section>

      <p className="text-center text-xs text-[#78716C]" style={{ fontFamily: 'var(--font-body)' }}>
        <Link href="/waitlist" className="text-[#C2410C] hover:underline">
          Waitlist
        </Link>
        {' · '}
        <Link href="/" className="text-[#C2410C] hover:underline">
          Home
        </Link>
      </p>
    </div>
  );
}
