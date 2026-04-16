import { redirect } from 'next/navigation';

export default function RootLayout({
}: Readonly<{
  children: React.ReactNode;
}>) {
  redirect('/en');
}
