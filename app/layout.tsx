import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Decksmith — AI Presentation Studio',
  description: 'Turn your ideas and images into a polished, editable PowerPoint presentation.',
  openGraph: {
    title: 'Decksmith — AI Presentation Studio',
    description: 'Turn ideas into polished PowerPoint decks.',
    type: 'website',
    images: [{ url: '/og.png', width: 1792, height: 941, alt: 'Decksmith AI Presentation Studio' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Decksmith — AI Presentation Studio',
    description: 'Turn ideas into polished PowerPoint decks.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
