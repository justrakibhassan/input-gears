import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthSync } from "@/components/auth/auth-sync";
import { prisma } from "@/lib/prisma";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000"
  ),
  title: {
    default: "Input Gears | Premium Mechanical Keyboards & Gear",
    template: "%s | Input Gears",
  },
  description:
    "Explore Input Gears for premium mechanical keyboards, high-performance gaming mice, and professional desk accessories. Level up your productivity setup.",
  keywords: [
    "mechanical keyboards",
    "gaming gear",
    "custom keyboards",
    "Input Gears",
    "productivity setup",
    "audiophile gear",
  ],
  authors: [{ name: "Input Gears Team" }],
  creator: "Input Gears",
  publisher: "Input Gears",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Input Gears",
    title: "Input Gears | Premium Gear for Productivity",
    description:
      "Premium selection of mechanical keyboards and high-performance gear for enthusiasts.",
    images: [
      {
        url: "/input-gears.webp",
        width: 1200,
        height: 630,
        alt: "Input Gears Branding",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Input Gears | Premium Gear for Productivity",
    description:
      "Premium selection of mechanical keyboards and high-performance gear.",
    images: ["/input-gears.webp"],
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Input Gears",
    url: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000"}/products?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Toaster position="top-center" richColors />
        <AuthSync />
        {children}
      </body>
    </html>
  );
}

