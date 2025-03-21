import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/components/Header';

const inter = Inter({ subsets: ['latin'] });

// Helper function to ensure URL has a protocol
function ensureUrlHasProtocol(url: string): string {
  if (!url) return 'http://localhost:3000';
  return url.startsWith('http://') || url.startsWith('https://') 
    ? url 
    : `https://${url}`;
}

const baseUrl = ensureUrlHasProtocol(process.env.NEXT_PUBLIC_APP_URL || 'localhost:3000');

export const metadata: Metadata = {
  title: 'AI Research Summary',
  description: 'Concise, structured summaries of AI research papers for non-technical audiences',
  metadataBase: new URL(baseUrl),
  openGraph: {
    title: 'AI Research Summary',
    description: 'Concise, structured summaries of AI research papers for non-technical audiences',
    url: baseUrl,
    siteName: 'AI Research Summary',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Research Summary',
    description: 'Concise, structured summaries of AI research papers for non-technical audiences',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
