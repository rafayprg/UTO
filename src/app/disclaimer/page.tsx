import type { Metadata } from "next";
import Link from "next/link";
import { site, absolute } from "@/lib/site";

export const metadata: Metadata = {
  title: "Disclaimer — Computational & Financial Limits",
  description:
    "Important disclosures regarding calculations, financial formulas, image processing, and technical boundaries on Localtools.",
  alternates: {
    canonical: "/disclaimer/",
  },
  openGraph: {
    title: "Disclaimer — Localtools",
    description: "Read about computational boundaries, financial estimates, and technical disclaimers for Localtools.",
    url: absolute("/disclaimer/"),
    siteName: site.name,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Disclaimer — Localtools",
    description: "Important technical disclosures and computational boundaries.",
  },
};

export default function Disclaimer() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": absolute("/disclaimer/#webpage"),
        "url": absolute("/disclaimer/"),
        "name": "Localtools General Disclaimer",
        "description": "Notice regarding calculations, tax estimates, readability indices, and file limits.",
        "isPartOf": {
          "@type": "WebSite",
          "@id": absolute("/#website"),
          "name": site.name,
          "url": absolute("/"),
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": absolute("/disclaimer/#breadcrumb"),
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
            "name": "Disclaimer",
            "item": absolute("/disclaimer/"),
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
            <li className="text-foreground font-medium" aria-current="page">Disclaimer</li>
          </ol>
        </nav>

        <p className="eyebrow">KNOW THE LIMITS</p>
        <h1>Useful tools.<br />Results worth checking.</h1>
        <p>
          Localtools provides general-purpose browser utilities, computational calculators, and educational guides. All computational results should be interpreted within the technical boundaries outlined below.
        </p>

        <h2>Calculations, Tax Estimates &amp; Financial Disclosures</h2>
        <p>
          Our financial and mathematical calculators utilize standard floating-point arithmetic and user-supplied figures. They do not connect to real-time currency exchange feeds or live municipal tax schedules. <strong>None of the calculations provided constitute certified financial, tax, investment, or legal advice.</strong> Always consult with a licensed CPA, financial planner, or attorney before executing major financial decisions or filing tax returns.
        </p>

        <h2>File Transformation &amp; Algorithmic Limits</h2>
        <p>
          Automatic client-side background removal relies on neural segmentation models running in your browser; complex backgrounds with low contrast or intricate hair details may require manual touch-ups. Image re-encoding may strip proprietary EXIF metadata. PDF merging concatenates binary page streams but will invalidate cryptographic X.509 signature envelopes. Always retain unedited copies of your original files.
        </p>

        <h2>Readability &amp; Linguistic Metrics</h2>
        <p>
          Readability formulas (such as Flesch-Kincaid or Gunning Fog) measure structural sentence length and syllable frequency. They serve as valuable editorial guidelines, but they cannot assess contextual nuance, factual accuracy, or subject matter depth.
        </p>

        <h2>Third-Party Content &amp; Fair Use</h2>
        <p>
          YouTube thumbnails and subtitle media belong to their respective copyright holders. Tools that interface with public web URLs are provided for legitimate personal archiving, content creation, and accessibility workflows.
        </p>
        <p>
          For more information, please consult our <Link href="/terms/">Terms of Use</Link> or inspect our <Link href="/editorial-policy/">Editorial Standards</Link>.
        </p>
      </article>
    </>
  );
}
