import type { Metadata } from 'next';
import './globals.css';
import { AppProviders } from '@/components/AppProviders';

export const metadata: Metadata = {
  title: 'CeX UK Game Price Tracker & Travel Shopping Basket',
  description: 'Track prices of PS4, PS5, Xbox 360, Xbox One, and Xbox Series X games on CeX UK (uk.webuy.com). Create your travel shopping list and monitor daily deals.',
};

const themeScript = `(() => { try { const stored = localStorage.getItem('cex-theme'); const theme = stored === 'light' || stored === 'dark' ? stored : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); document.documentElement.classList.toggle('dark', theme === 'dark'); document.documentElement.dataset.theme = theme; } catch {} })()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100 selection:bg-blue-600 selection:text-white">
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
