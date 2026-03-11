import type { Metadata, Viewport } from 'next';
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://atelier-atlas.vercel.app'),
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
  openGraph: {
    title: 'Atelier Atlas — Global Fashion Intelligence',
    description:
      'Bloomberg-style interactive 3D globe mapping fashion trends, traditional clothing, industry data, and cultural intelligence across 195 countries.',
    type: 'website',
    siteName: 'Atelier Atlas',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Atelier Atlas — Global Fashion Intelligence',
    description:
      'Bloomberg-style interactive 3D globe mapping fashion trends, traditional clothing, industry data, and cultural intelligence across 195 countries.',
  },
  robots: {
    index: true,
    follow: true,
  },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Atelier Atlas',
              description:
                'Bloomberg-style interactive 3D globe mapping fashion trends, traditional clothing, industry data, and cultural intelligence across 195 countries.',
              applicationCategory: 'EducationalApplication',
              operatingSystem: 'Web Browser',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
