import type { Metadata } from "next";
import { Geist, Geist_Mono, Barlow } from "next/font/google";
import { siteConfig } from '@/lib/seo/config';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const barlow = Barlow({
  weight: '700',
  subsets: ["latin"],
  variable: "--font-barlow",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} – Best Coupons, Promo Codes & Cashback Deals`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    title: `${siteConfig.name} – Best Coupons, Promo Codes & Cashback Deals`,
    description: siteConfig.description,
    url: siteConfig.url,
    images: [{ url: siteConfig.ogImage, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} – Best Coupons, Promo Codes & Cashback Deals`,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  alternates: {
    canonical: siteConfig.url,
  },
  icons: {
    icon: [
      {
        url: '/Coupachu Icone-2.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/Coupachu Icone-2.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
    apple: '/Coupachu Icone-2.svg',
    shortcut: '/Coupachu Icone-2.svg',
  },
  verification: {
    google: 'bJ8g82iFRwAnpdu7hp0nPwBUfnhXHb6Iuo2yRyn4yZI',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="overflow-x-hidden max-w-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${barlow.variable} antialiased overflow-x-hidden w-full max-w-full`}
      >
        {children}
      </body>
    </html>
  );
}
