import type { Metadata } from "next";
import GoatLandingPage from "@/components/3d/GoatLandingPage";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  title: "Localtools — 1,034+ 100% Free Private Browser Tools for Work, Code & Everyday Math",
  description:
    "One unified 3D-accelerated workspace of 1,034+ 100% free professional tools for PDFs, finance, code, media, and calculations. Zero server uploads. 100% private in-browser execution.",
  openGraph: {
    title: "Localtools — 1,034+ Free Private Browser Tools",
    description:
      "1,034+ browser-native utilities with 0 server uploads. 100% private client-side execution.",
    url: "/",
    siteName: "Localtools",
    locale: "en_US",
    type: "website",
  },
};

export default function Home() {
  return <GoatLandingPage />;
}
