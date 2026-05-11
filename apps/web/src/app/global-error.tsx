'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Dynamically import Sentry only on client side to avoid prerender errors.
  // Sentry's SDK calls useContext during module initialization which crashes
  // during static prerender when React dispatcher is null.
  useEffect(() => {
    import('@sentry/nextjs').then((Sentry) => {
      Sentry.captureException(error);
    });
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold">Something went wrong</h1>
            <p className="mb-8 text-gray-600">{error.message || 'An unexpected error occurred'}</p>
            <button
              onClick={reset}
              className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
