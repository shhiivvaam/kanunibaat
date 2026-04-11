import type { Metadata } from 'next';
import { Fraunces, Geist_Mono, Plus_Jakarta_Sans } from 'next/font/google';

import { Providers } from '@/components/providers';
import './globals.css';

const fontDisplay = Fraunces({
  variable: '--font-kb-display',
  subsets: ['latin'],
});

const fontBody = Plus_Jakarta_Sans({
  variable: '--font-kb-body',
  subsets: ['latin', 'latin-ext'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'KanooniBaat',
  description:
    'Legal help in plain language for India — ask questions, review documents, and connect with verified lawyers.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontDisplay.variable} ${fontBody.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
