import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nicodetta — Paintings & Clothes',
  description: 'Original paintings and artworked one-off clothing by Nicodetta.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
