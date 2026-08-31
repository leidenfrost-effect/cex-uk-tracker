import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/components/AppProviders';

export const metadata: Metadata = {
  title: 'CeX UK Game Price Tracker & Travel Shopping Basket',
  description: 'Track prices of PS4, PS5, Xbox 360, Xbox One, and Xbox Series X games on CeX UK (uk.webuy.com). Create your travel shopping list and monitor daily deals.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="dark">
      <body className="min-h-screen bg-[#121212] text-zinc-100 flex flex-col selection:bg-red-600 selection:text-white">
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
