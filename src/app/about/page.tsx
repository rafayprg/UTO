import type { Metadata } from "next";
import Link from "next/link";
import { site, absolute } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Localtools — Mission, Architecture & Privacy First Tooling",
  description:
    "Learn how Localtools builds private, client-side developer utilities, document editors, and calculators that run 100% on your device with zero server uploads.",
  alternates: {
    canonical: "/about/",
  },
  openGraph: {
    title: "About Localtools — Client-Side Privacy First Utilities",
    description:
      "Everyday digital tasks made fast, private, and accessible. No file uploads, no tracking, and 100% in-browser processing.",
    url: absolute("/about/"),
    siteName: site.name,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Localtools — Zero Server Uploads",
    description: "Learn how Localtools executes all calculations and file operations directly in your browser.",
  },
};

export default function About() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": absolute("/about/#webpage"),
        "url": absolute("/about/"),
        "name": "About Localtools",
        "description": "Learn about the mission, architecture, and team behind Localtools.",
        "isPartOf": {
          "@type": "WebSite",
          "@id": absolute("/#website"),
          "name": site.name,
          "url": absolute("/"),
        },
      },
      {
        "@type": "Organization",
        "@id": absolute("/#organization"),
        "name": site.name,
        "url": absolute("/"),
        "logo": {
          "@type": "ImageObject",
          "url": absolute("/logo.png"),
        },
        "description": site.description,
      },
      {
        "@type": "BreadcrumbList",
        "@id": absolute("/about/#breadcrumb"),
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
            "name": "About",
            "item": absolute("/about/"),
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
            <li className="text-foreground font-medium" aria-current="page">About</li>
          </ol>
        </nav>

        <p className="eyebrow">SMALL TOOLS. THOUGHTFUL DEFAULTS.</p>
        <h1>A simpler, private place<br />to get things done.</h1>
        <p>
          Localtools brings everyday digital tasks into one consistent, reliable workspace. It covers nine core suites: documents, images, media, developer tools, encoding and security, creator workflows, writing, calculators, and data transformation.
        </p>

        <h2>Your browser does 100% of the work</h2>
        <p>
          File processing runs entirely on your local device. There is no remote upload API, processing queue, remote database, or mandatory account barrier behind these tools. PDF and archive jobs run inside sandboxed browser Web Workers; image transformation uses modern WebAssembly and HTML5 Canvas APIs. Even client-side AI tasks, like our background remover, download model weights directly into your browser’s cache to run offline inference locally.
        </p>

        <h2>Useful explanations belong beside useful tools</h2>
        <p>
          Each tool on Localtools is accompanied by a practical, example-led guide, worked calculation examples, and clear disclosures about its technical limits. We transparently explain real-world caveats—such as unsupported image codecs, variable readability indices, and the mathematical difference between profit margin and markup. We never make hollow promises that every corrupt file or oversized payload will work on every mobile device.
        </p>

        <h2>A focused, transparent platform</h2>
        <p>
          We believe in software that respects user agency and privacy. The platform avoids invasive trackers and unnecessary dependencies. Whether you are formatting confidential client JSON, merging payroll PDFs, calculating quarterly state tax liabilities, or generating secure Wi-Fi QR codes, your sensitive data never leaves your computer.
        </p>
        <p>
          Read our <Link href="/privacy-policy/">Privacy Policy</Link> for full details on how local sandboxing keeps your data safe, or explore our <Link href="/editorial-policy/">Editorial Standards</Link> to learn how our technical guides are verified.
        </p>
      </article>
    </>
  );
}
