import type { Metadata } from "next";
import Link from "next/link";
import { publishedTools } from "@/lib/published";
import { toolPath } from "@/lib/tools-registry";
import { site, absolute } from "@/lib/site";
import { GuideBrowser, type GuideSummary } from "@/components/directory/GuideBrowser";

const totalCount = publishedTools.length.toLocaleString("en-US");

export const metadata: Metadata = {
  title: `Tool Guides & Calculation Formulas Hub (${totalCount} Detailed Guides)`,
  description: `Browse ${totalCount} comprehensive tutorials, mathematical formulas, and step-by-step practical guides for all Localtools utilities.`,
  alternates: {
    canonical: "/guides/",
  },
  openGraph: {
    title: `Calculation Formulas & Methodology Guides | Localtools`,
    description: `Complete technical guides with worked examples and statutory references for ${totalCount} private browser tools.`,
    url: absolute("/guides/"),
    siteName: site.name,
    locale: "en_US",
    type: "website",
  },
};

export default function GuidesHubPage() {
  const guideSummaries: GuideSummary[] = publishedTools.map((t) => ({
    title: t.title,
    desc: t.shortDesc,
    category: t.category,
    group: t.group,
    guideHref: `/tools/${t.category}/${t.slug}/guide/`,
    toolHref: toolPath(t),
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": absolute("/guides/#webpage"),
        url: absolute("/guides/"),
        name: `Localtools Methodologies & Calculation Guides`,
        description: `Technical guides, formulas, and FAQs for ${totalCount} client-side utilities.`,
        isPartOf: { "@type": "WebSite", "@id": absolute("/#website"), name: site.name, url: absolute("/") },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absolute("/") },
          { "@type": "ListItem", position: 2, name: "Guides", item: absolute("/guides/") },
        ],
      },
    ],
  };

  return (
    <div className="lt-wrap py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <header className="lt-page-head mb-8">
        <nav className="lt-crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Guides</span>
        </nav>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-ink tracking-tight mb-2">
          Technical Guides, Statutory Rules &amp; Formulas
        </h1>
        <p className="lt-page-head__lede text-graphite text-base max-w-2xl">
          Detailed documentation and mathematical methodologies for all {totalCount} tools. 
          Each guide contains worked calculation examples, legal/statutory citations, edge-case analysis, and answers to common questions.
        </p>
      </header>

      <GuideBrowser guides={guideSummaries} />
    </div>
  );
}
