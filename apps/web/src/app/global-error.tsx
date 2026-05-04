export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <html lang="en">
      <body>
        <h1>Something went wrong</h1>
        <p>{error.message || 'An unexpected error occurred'}</p>
      </body>
    </html>
  );
}
