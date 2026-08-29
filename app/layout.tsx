import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Run It Away',
  description: 'Capture the problem. Step away. Come back with the next move.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
