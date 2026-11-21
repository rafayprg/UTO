import { site } from "@/lib/site";

export function BrandJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${site.url}/#organization`,
        name: site.name,
        url: site.url,
        logo: {
          "@type": "ImageObject",
          "@id": `${site.url}/#logo`,
          url: `${site.url}/favicon.svg`,
          caption: site.name,
        },
        description: site.description,
        foundingDate: "2026",
        sameAs: [
          "https://github.com/rafayprg/UTO",
        ],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "Customer Support",
          email: site.supportEmail || "support@localtools.dev",
          availableLanguage: ["English"],
        },
      },
      {
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        url: site.url,
        name: site.name,
        description: site.description,
        publisher: {
          "@id": `${site.url}/#organization`,
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${site.url}/tools?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
        inLanguage: "en-US",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
