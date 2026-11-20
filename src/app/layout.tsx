import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { site } from "@/lib/site";
import "./globals.css";
export const metadata: Metadata = { metadataBase: new URL(site.url), title: { default: "Localtools — Private browser tools and practical guides", template: "%s | Localtools" }, description: site.description, openGraph: { type: "website", siteName: site.name, title: site.name, description: site.description, locale: "en_US" } };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en-US"><body><a className="skip-link" href="#main">Skip to content</a><Header/><main id="main">{children}</main><Footer/></body></html>; }
