import type { Metadata } from "next";
import { HomePage } from "@/components/home/HomePage";
import { publishedTools } from "@/lib/published";

const total = publishedTools.length.toLocaleString("en-US");

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  title: {
    absolute: `Localtools — ${total} Free Private Tools That Run in Your Browser`,
  },
  description: `${total} free calculators, converters and document builders. Paycheck and tax tools for every US state, PDF and image tools, and more. Nothing is uploaded.`,
  openGraph: {
    title: `Localtools — ${total} Free Private Browser Tools`,
    description: `${total} free tools that run in your browser. No uploads, no sign-up.`,
    url: "/",
    siteName: "Localtools",
    locale: "en_US",
    type: "website",
  },
};

export default function Home() {
  return <HomePage />;
}
