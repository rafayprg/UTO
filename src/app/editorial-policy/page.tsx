import type { Metadata } from "next";
import Link from "next/link";
import { site, absolute } from "@/lib/site";

export const metadata: Metadata = {
  title: "Editorial Policy & Verification Standards | Localtools",
  description:
    "How Localtools prepares practical technical guides, audits calculation formulas, explains tool constraints, and verifies accuracy with zero hype.",
  alternates: {
    canonical: "/editorial-policy/",
  },
  openGraph: {
    title: "Editorial Policy & Verification Standards — Localtools",
    description: "Learn how our technical writers and engineers fact-check guides, mathematical formulas, and technical explanations.",
    url: absolute("/editorial-policy/"),
    siteName: site.name,
    locale: "en_US",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Editorial Policy & Verification Standards",
    description: "Standards and principles governing all guides and tools published on Localtools.",
  },
};

export default function EditorialPolicy() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": absolute("/editorial-policy/#webpage"),
        "url": absolute("/editorial-policy/"),
        "name": "Editorial Standards & Verification Policy",
        "description": "How Localtools writes, fact-checks, and updates technical guides and calculation tools.",
        "isPartOf": {
          "@type": "WebSite",
          "@id": absolute("/#website"),
          "name": site.name,
          "url": absolute("/"),
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": absolute("/editorial-policy/#breadcrumb"),
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
            "name": "Editorial Policy",
            "item": absolute("/editorial-policy/"),
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
      <article className="page-container prose">
        <nav aria-label="Breadcrumbs" className="article-breadcrumbs not-prose mb-6">
          <ol className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <li><Link href="/" className="hover:text-foreground">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li className="text-foreground font-medium" aria-current="page">Editorial Policy</li>
          </ol>
        </nav>

        <p className="eyebrow">PRACTICAL HELP, WITH CLEAR LIMITS</p>
        <h1>Our editorial &amp; verification standards</h1>
        <p>
          Localtools pairs working client-side browser utilities with authoritative technical explanations that help you choose valid inputs, understand mathematical outputs, and spot mistakes. A guide should solve a real engineering or business task, not simply manipulate search keywords or bloat page lengths.
        </p>

        <h2>What our guides cover</h2>
        <p>
          Each technical guide on Localtools explains the core workflow, relevant file specifications, and common failure modes. Our long-form tutorials dive deep into real-world engineering decisions: when to choose modern AVIF or WebP over legacy JPG, how profit margin structurally differs from markup percentage, or why merging PDF binaries can invalidate cryptographic X.509 certificate signatures. Every guide links directly to its live companion tool so you can transition seamlessly between learning and executing.
        </p>

        <h2>How content is researched &amp; verified</h2>
        <p>
          Our technical content is prepared and vetted by engineers with real-world systems experience. Content is cross-verified against official RFC standards, W3C specifications, IRS publications, and browser API implementations. We never fabricate professional credentials, fake customer testimonials, or inflated usage metrics.
        </p>
        <p>
          When referencing third-party libraries or web standards, we reference official documentation and primary technical sources. All calculation formulas are explicitly printed in the text so users can independently verify outputs with pen and paper or spreadsheet software.
        </p>

        <h2>Algorithmic &amp; mathematical integrity</h2>
        <p>
          The launch verification includes automated code tests covering JSON schema validation, Wi-Fi payload escaping, SRT subtitle timecode alignment, Unicode character offsets, financial percentage formulas, and archive compression limits. Automated test suites run continuously against all client-side processing operations.
        </p>

        <h2>Advertising and editorial independence</h2>
        <p>
          Editorial decisions are strictly separated from commercial monetization. Reserved advertising units are clearly labeled with &ldquo;ADVERTISEMENT&rdquo; indicators and positioned away from operational buttons to prevent accidental clicks. No advertiser or sponsor dictates the outcome of our technical guides, benchmark results, or code recommendations.
        </p>
        <p>
          Read more about <Link href="/about/">our platform mission</Link>, review our <Link href="/privacy-policy/">privacy protections</Link>, or inspect the <Link href="/disclaimer/">terms and disclaimers</Link> governing our free utilities.
        </p>
      </article>
    </>
  );
}
