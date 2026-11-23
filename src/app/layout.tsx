import type { Metadata, Viewport } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BrandJsonLd } from "@/components/seo/BrandJsonLd";
import { GoogleAnalytics } from "@/components/seo/GoogleAnalytics";
import { SearchDialog } from "@/components/layout/SearchDialog";
import { site } from "@/lib/site";
import { Schibsted_Grotesk } from "next/font/google";
import "./globals.css";
import "./ui.css";
import "./engines.css";

const schibsted = Schibsted_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-schibsted",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#f5f6f2",
};

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Localtools — 100% Free Private Browser Tools & Practical Guides",
    template: "%s | Localtools",
  },
  description: site.description,
  applicationName: site.name,
  alternates: {
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
  authors: [{ name: "Localtools Engineering" }],
  generator: "Next.js 15",
  keywords: [
    "free online tools",
    "private browser utilities",
    "client-side pdf converter",
    "us state paycheck calculator",
    "platform fee calculator",
    "unit pair converter",
    "format pair converter",
    "zero upload privacy tools",
  ],
  referrer: "origin-when-cross-origin",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/favicon.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "google-site-verification-token",
    other: {
      "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || "bing-verification-token",
    },
  },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: "Localtools — 100% Free Private Browser Tools",
    description: site.description,
    url: site.url,
    locale: "en_US",
    images: [
      {
        url: "/favicon.svg",
        width: 512,
        height: 512,
        alt: "Localtools Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Localtools — 100% Free Private Browser Tools",
    description: site.description,
    images: ["/favicon.svg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-US" className={schibsted.variable}>
      <head>
        <BrandJsonLd />
        <GoogleAnalytics />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <SearchDialog />
      </body>
    </html>
  );
}
