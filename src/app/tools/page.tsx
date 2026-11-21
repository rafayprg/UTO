import { Metadata } from "next";
import { ToolDirectory } from "@/components/ToolDirectory";
import { CategoryNav } from "@/components/CategoryNav";
import { PrivacyBadge } from "@/components/PrivacyBadge";
import { tools, liveTools, categories } from "@/lib/tools-registry";
import { Shapes, Sparkles } from "lucide-react";
import { site, absolute } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    absolute: "1,034+ Free Online Tools & Web Apps Directory (Private, No Sign Up) | Localtools",
  },
  description: "Browse our complete directory of 1,034+ client-side tools and calculators. 100% free, private in-browser execution with zero server uploads and no sign up required.",
  alternates: { canonical: "/tools/" },
  openGraph: {
    title: "1,034+ Free Online Tools & Web Apps Directory (Private, No Sign Up) | Localtools",
    description: "Browse 1,034+ free browser-based tools. 100% private, zero uploads, no sign up required.",
    url: absolute("/tools/"),
    siteName: site.name,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "1,034+ Free Online Tools & Web Apps Directory | Localtools",
    description: "100% private browser tools with zero uploads and no signup.",
  },
};

export default function ToolsDirectoryPage() {
  const categoryCount = Object.keys(categories).length;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": absolute("/tools/#webpage"),
        "url": absolute("/tools/"),
        "name": "1,034+ Free Online Tools & Web Apps Directory",
        "description": "Directory of free client-side developer utilities, converters, calculators, and media tools.",
        "isPartOf": {
          "@type": "WebSite",
          "@id": absolute("/#website"),
          "name": site.name,
          "url": absolute("/"),
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": absolute("/tools/#breadcrumb"),
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": absolute("/"),
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "All Tools",
            "item": absolute("/tools/"),
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="app-layout">
        <CategoryNav />
        <main className="hub-main">
          <header className="page-intro">
            <span className="tool-icon large">
              <Shapes size={28} />
            </span>
            <p className="eyebrow">
              <Sparkles size={13} /> COMPLETE DIRECTORY · {liveTools.length} LIVE APPS
            </p>
            <h1>All Tools & Applications</h1>
            <p>
              Explore all {tools.length} browser-native tools across {categoryCount} specialized suites.
              Every tool runs 100% on your device with zero server processing or account requirements.
            </p>
          </header>

          <PrivacyBadge />

          <ToolDirectory />
        </main>
      </div>
    </>
  );
}
