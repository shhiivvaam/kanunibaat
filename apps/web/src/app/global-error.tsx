// Server component - no 'use client' to avoid prerender React hook issues
export const dynamic = 'force-dynamic';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">Something went wrong</h1>
          <p className="mb-8 text-gray-600">{error?.message || 'An unexpected error occurred'}</p>
          <a
            href="/"
            className="inline-block rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Go home
          </a>
        </div>
      </body>
    </html>
  );
}
