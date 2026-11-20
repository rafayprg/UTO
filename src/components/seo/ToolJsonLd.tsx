import React from "react";
import type { ToolDefinition } from "@/lib/tools-registry";
import { absolute, site } from "@/lib/site";

interface ToolJsonLdProps {
  tool: ToolDefinition;
  canonicalUrl: string;
  categoryName: string;
  faqs?: { question: string; answer: string }[];
}

function getApplicationCategory(category: string): string {
  switch (category) {
    case "finance":
    case "real-estate":
    case "insurance":
      return "FinanceApplication";
    case "dev":
    case "data":
      return "DeveloperApplication";
    case "crypto":
      return "SecurityApplication";
    case "image":
      return "DesignApplication";
    case "media":
    case "youtube":
      return "MultimediaApplication";
    case "business":
    case "marketing":
      return "BusinessApplication";
    default:
      return "UtilitiesApplication";
  }
}

export function ToolJsonLd({ tool, canonicalUrl, categoryName, faqs }: ToolJsonLdProps) {
  const faqList = faqs || (tool.faqs && tool.faqs.length > 0
    ? tool.faqs
    : tool.faq && tool.faq.length > 0
      ? tool.faq.map(item => ({ question: item.q, answer: item.a }))
      : []);

  const fullUrl = absolute(canonicalUrl);
  const appCategory = getApplicationCategory(tool.category);

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["SoftwareApplication", "WebApplication"],
        "@id": `${fullUrl}#software`,
        name: tool.seoTitle || tool.title || tool.name,
        alternateName: tool.title,
        description: tool.metaDescription || tool.shortDesc,
        applicationCategory: appCategory,
        applicationSubCategory: categoryName,
        operatingSystem: "All (Web Browser)",
        browserRequirements: "Requires JavaScript. Requires HTML5.",
        url: fullUrl,
        softwareVersion: "1.0",
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          category: "Free",
        },
        featureList: [
          "100% Free with zero sign up required",
          "Client-side processing with zero server uploads",
          "Air-gapped private in-browser computation",
          "Instant real-time calculations and conversions",
        ],
        creator: {
          "@type": "Organization",
          name: site.name,
          url: absolute("/"),
        },
        publisher: {
          "@type": "Organization",
          name: site.name,
          url: absolute("/"),
        },
      },
      ...(faqList.length > 0
        ? [
            {
              "@type": "FAQPage",
              "@id": `${fullUrl}#faq`,
              mainEntity: faqList.map(faq => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.answer,
                },
              })),
            },
          ]
        : []),
      {
        "@type": "BreadcrumbList",
        "@id": `${fullUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: absolute("/"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: categoryName,
            item: absolute(`/tools/${tool.category}/`),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: tool.title || tool.name,
            item: fullUrl,
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
      }}
    />
  );
}
