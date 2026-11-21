import type { Metadata } from "next";
import Link from "next/link";
import { site, absolute } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy — Zero-Upload Client-Side Guarantee",
  description:
    "Comprehensive privacy policy for Localtools. Discover how client-side WebAssembly and browser Web Workers keep your files, images, and text 100% private.",
  alternates: {
    canonical: "/privacy-policy/",
  },
  openGraph: {
    title: "Privacy Policy — Localtools Client-Side Guarantee",
    description: "Learn how Localtools executes 100% of tasks on your device with zero server uploads and zero data retention.",
    url: absolute("/privacy-policy/"),
    siteName: site.name,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy — Localtools",
    description: "Your files never leave your device. Read the Localtools complete privacy policy.",
  },
};

export default function Privacy() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": absolute("/privacy-policy/#webpage"),
        "url": absolute("/privacy-policy/"),
        "name": "Localtools Privacy Policy",
        "description": "Details on client-side sandboxing, data handling, and third-party asset retrieval.",
        "isPartOf": {
          "@type": "WebSite",
          "@id": absolute("/#website"),
          "name": site.name,
          "url": absolute("/"),
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": absolute("/privacy-policy/#breadcrumb"),
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
            "name": "Privacy Policy",
            "item": absolute("/privacy-policy/"),
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
            <li className="text-foreground font-medium" aria-current="page">Privacy Policy</li>
          </ol>
        </nav>

        <p className="eyebrow">YOUR DEVICE. YOUR WORK.</p>
        <h1>Privacy policy &amp; data governance</h1>
        <p className="text-sm text-muted-foreground">Last updated: November 21, 2026</p>
        
        <p>
          At Localtools, user privacy is not an afterthought or a marketing phrase—it is the foundational architectural principle of our entire software platform. This notice explains how data is handled across our utilities and website.
        </p>

        <h2>1. Zero-Upload Architecture: Everything Runs on Your Device</h2>
        <p>
          Unlike conventional online converter websites that silently upload your confidential PDFs, contracts, tax returns, and photos to remote cloud servers, Localtools performs all operations <strong>entirely within your web browser</strong>.
        </p>
        <ul>
          <li><strong>No Backend Upload API:</strong> The website has no remote server endpoints capable of receiving, parsing, or storing user files.</li>
          <li><strong>Client-Side Execution:</strong> PDF compilation runs inside browser WebAssembly (Wasm) routines, archive creation uses JavaScript streams, and calculations occur in immediate thread memory.</li>
          <li><strong>Zero Data Retention:</strong> As soon as you refresh or close your browser tab, all transient memory buffers containing your inputs and outputs are instantly purged by the browser runtime.</li>
        </ul>

        <h2>2. External Asset Retrieval Disclosures</h2>
        <p>
          Certain specialized tools retrieve static assets or remote media URLs upon explicit user action:
        </p>
        <ul>
          <li><strong>Local AI Models:</strong> The background removal tool downloads static ONNX model weight files from certified CDN endpoints to run on-device WebGL neural segmentation. Once cached, the model runs offline without transmitting image bytes.</li>
          <li><strong>Public Media Metadata:</strong> When fetching public YouTube thumbnails or subtitles, the browser requests public image URLs directly from Google/YouTube CDN servers. The text and video IDs entered remain local.</li>
        </ul>

        <h2>3. Cookies, Analytics &amp; Tracking</h2>
        <p>
          Localtools does not deploy invasive device fingerprinting, user surveillance scripts, or persistent cross-site tracking cookies. We do not sell, rent, or monetize your personal usage history.
        </p>

        <h2>4. Advertising Standards &amp; Compliance</h2>
        <p>
          If advertising units are displayed, they are served via verified partners (such as Google AdSense) that adhere to strict industry privacy frameworks. Third-party ad vendors may use standard non-personally identifiable cookies to serve contextual advertisements based on prior visits to this or other websites. You can manage your personalized ad preferences through Google’s Ad Settings or via industry opt-out portals.
        </p>

        <h2>5. Questions &amp; Support</h2>
        <p>
          For privacy inquiries or technical feedback regarding our client-side sandboxing, please review our <Link href="/contact/">Contact Page</Link> or inspect our open <Link href="/editorial-policy/">Editorial Standards</Link>.
        </p>
      </article>
    </>
  );
}
