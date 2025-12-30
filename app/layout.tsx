import type { Metadata } from "next";
import { Geist, Geist_Mono, Barlow } from "next/font/google";
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
  title: "COUPACHU",
  description: "Manage coupons and discounts with Firebase backend",
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
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  verification: {
    google: 'bJ8g82iFRwAnpdu7hp0nPwBUfnhXHb6Iuo2yRyn4yZI',
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
        className={`${geistSans.variable} ${geistMono.variable} ${barlow.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
