import type { Metadata } from 'next';
import { Inter, Playfair_Display, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Atelier Atlas — Global Fashion Intelligence',
  description:
    'Bloomberg-style interactive 3D globe mapping fashion trends, traditional clothing, industry data, and cultural intelligence across 195 countries.',
  keywords: [
    'fashion',
    'atlas',
    'globe',
    'traditional clothing',
    'textile',
    'fashion intelligence',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${playfair.variable} ${jetbrains.variable} font-sans antialiased bg-[#0A0A1A] text-[#F0F0F5] overflow-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
