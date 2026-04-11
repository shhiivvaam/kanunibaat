import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'KanooniBaat — Legal help in plain language for India';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 64,
          background: 'linear-gradient(135deg, #1c1917 0%, #292524 50%, #431407 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: '#C2410C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            ⚖
          </div>
          <span style={{ fontSize: 42, fontWeight: 700, color: 'white' }}>KanooniBaat</span>
        </div>
        <p
          style={{
            fontSize: 36,
            color: '#e7e5e4',
            lineHeight: 1.35,
            maxWidth: 900,
            fontWeight: 500,
          }}
        >
          Legal help in plain language — notices, rights, and verified lawyers for India.
        </p>
        <p style={{ marginTop: 28, fontSize: 22, color: '#a8a29e' }}>kanoonibaat.in</p>
      </div>
    ),
    { ...size },
  );
}
