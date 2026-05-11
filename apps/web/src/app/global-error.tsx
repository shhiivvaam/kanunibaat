export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  // Note: Error reporting to Sentry is handled by the error boundary in layout.tsx
  // Global error must be server-compatible for prerendering
  // Reset functionality is handled by the browser's natural refresh behavior

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold">Something went wrong</h1>
            <p className="mb-8 text-gray-600">{error.message || 'An unexpected error occurred'}</p>
            <div className="text-sm text-gray-500">
              Please refresh the page to try again
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
