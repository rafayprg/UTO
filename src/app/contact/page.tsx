import type { Metadata } from "next";
import Link from "next/link";
import { site, absolute } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Localtools — Feedback, Support & Bug Reports",
  description:
    "Have a suggestion or encountered an issue with one of our client-side tools? Reach out to the Localtools team with feedback or technical reports.",
  alternates: {
    canonical: "/contact/",
  },
  openGraph: {
    title: "Contact Localtools — Support & Feedback",
    description: "Submit feedback, feature suggestions, or bug reports directly to the Localtools development team.",
    url: absolute("/contact/"),
    siteName: site.name,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Localtools",
    description: "Get in touch with the team behind Localtools.",
  },
};

export default function Contact() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ContactPage",
        "@id": absolute("/contact/#webpage"),
        "url": absolute("/contact/"),
        "name": "Contact Localtools",
        "description": "Contact and feedback information for Localtools.",
        "isPartOf": {
          "@type": "WebSite",
          "@id": absolute("/#website"),
          "name": site.name,
          "url": absolute("/"),
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": absolute("/contact/#breadcrumb"),
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
            "name": "Contact",
            "item": absolute("/contact/"),
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
            <li className="text-foreground font-medium" aria-current="page">Contact</li>
          </ol>
        </nav>

        <p className="eyebrow">HELP US MAKE EVERYDAY UTILITIES BETTER</p>
        <h1>Questions, ideas,<br />and practical feedback.</h1>
        <p>
          Have a tool recommendation or found an unexpected calculation or parsing result? The most actionable feedback describes what you were trying to accomplish and where the workflow fell short.
        </p>

        <div className="embed">
          <h2>Technical Support & Inquiries</h2>
          <p>
            For questions, bugs, or feature inquiries, our team actively monitors incoming requests. When submitting feedback, please avoid sharing private, confidential, or sensitive files.
          </p>
        </div>

        <h2>What to include in a bug report</h2>
        <ul>
          <li><strong>The tool name</strong> and the specific action you were attempting to perform.</li>
          <li><strong>Your operating environment:</strong> Browser name, version, and operating system (e.g., Chrome on Windows 11 or Safari on macOS).</li>
          <li><strong>Input specifications:</strong> File format (e.g., HEIC vs. JPG), approximate byte size, and clear step-by-step reproduction instructions.</li>
          <li><strong>Console messages:</strong> Any visible JavaScript errors or interface error notices.</li>
        </ul>
        <p>
          <em>Important:</em> Always test with small, synthetic sample files when demonstrating a processing glitch. Never send credentials, Wi-Fi passwords, private customer records, or financial disclosures.
        </p>

        <h2>Common Troubleshooting Steps</h2>
        <p>
          If a large PDF or high-resolution photo causes a browser tab to freeze, close unneeded background tabs to free up system RAM. If an in-browser machine learning model fails to initialize, verify that WebGL hardware acceleration is enabled in your browser preferences. Every tool page provides explicit input constraints and troubleshooting FAQs.
        </p>
      </article>
    </>
  );
}
