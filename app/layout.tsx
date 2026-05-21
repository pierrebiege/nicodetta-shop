import type { Metadata } from 'next';
import './globals.css';
import { SmoothScroll } from '@/components/SmoothScroll';

export const metadata: Metadata = {
  title: 'Nicodetta — Werke & Kleidung',
  description: 'Originale Bilder und verkünstlerte Kleidung von Nicodetta.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="bg-paper text-ink antialiased">
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
