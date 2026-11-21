import type { Metadata } from "next";
import Link from "next/link";
import { site, absolute } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use — User Rights & Service Agreement | Localtools",
  description:
    "Review the terms of service governing access to Localtools client-side calculators, developer converters, and document processing utilities.",
  alternates: {
    canonical: "/terms/",
  },
  openGraph: {
    title: "Terms of Use — Localtools",
    description: "Terms and conditions governing the use of Localtools free client-side tools.",
    url: absolute("/terms/"),
    siteName: site.name,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Use — Localtools",
    description: "Read the Localtools service agreement and usage terms.",
  },
};

export default function Terms() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": absolute("/terms/#webpage"),
        "url": absolute("/terms/"),
        "name": "Localtools Terms of Use",
        "description": "User rights, acceptable use policies, and limitations of liability.",
        "isPartOf": {
          "@type": "WebSite",
          "@id": absolute("/#website"),
          "name": site.name,
          "url": absolute("/"),
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": absolute("/terms/#breadcrumb"),
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
            "name": "Terms of Use",
            "item": absolute("/terms/"),
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
            <li className="text-foreground font-medium" aria-current="page">Terms of Use</li>
          </ol>
        </nav>

        <p className="eyebrow">TRANSPARENT &amp; FAIR TERMS</p>
        <h1>Terms of service</h1>
        <p className="text-sm text-muted-foreground">Effective Date: November 21, 2026</p>

        <p>
          Welcome to Localtools. By accessing or using our website and browser utilities, you agree to comply with and be bound by the following terms and conditions.
        </p>

        <h2>1. Permitted Use &amp; Intellectual Property</h2>
        <p>
          You are granted a non-exclusive, revocable license to utilize Localtools utilities for personal, educational, and commercial workflows. You must ensure you possess the legal authority, licenses, or copyrights for any files, text, images, or media formats you process using our tools. Processing copyrighted material without proper authorization remains your sole legal responsibility.
        </p>

        <h2>2. Backup Your Originals &amp; Verify Outputs</h2>
        <p>
          Localtools functions entirely non-destructively by generating new files and outputs rather than modifying or overwriting your source files. Always preserve unaltered copies of your original documents, datasets, and images. While our client-side routines are engineered for maximum reliability, client browser memory limits, malformed inputs, or hardware constraints can cause operations to terminate unexpectedly.
        </p>

        <h2>3. Disclaimer of Warranties</h2>
        <p>
          All tools, mathematical formulas, calculators, and tutorials are provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind, whether express or implied. Localtools does not warrant that utility functions will be uninterrupted, error-free, or meet every specialized business or legal requirement.
        </p>

        <h2>4. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by applicable law, Localtools and its developers shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use or inability to use our tools, including but not limited to loss of data, business disruption, or computational discrepancies.
        </p>

        <h2>5. Governing Policies</h2>
        <p>
          Please review our <Link href="/privacy-policy/">Privacy Policy</Link> for details on client-side data handling, our <Link href="/disclaimer/">General Disclaimer</Link> for calculation caveats, and our <Link href="/editorial-policy/">Editorial Policy</Link> for our fact-checking guidelines.
        </p>
      </article>
    </>
  );
}
