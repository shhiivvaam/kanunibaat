'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div
          style={{
            display: 'flex',
            minHeight: '100vh',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ marginBottom: '1rem', fontSize: '2.25rem', fontWeight: 'bold' }}>
              Something went wrong
            </h1>
            <p style={{ marginBottom: '2rem', color: '#4b5563' }}>
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={reset}
              style={{
                borderRadius: '0.25rem',
                backgroundColor: '#2563eb',
                padding: '0.5rem 1rem',
                color: '#fff',
                cursor: 'pointer',
                border: 'none',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
