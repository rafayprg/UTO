import React from "react";
import type { ToolDefinition } from "@/lib/tools-registry";
import { absolute } from "@/lib/site";

interface ToolJsonLdProps {
  tool: ToolDefinition;
  canonicalUrl: string;
  categoryName: string;
  faqs?: { question: string; answer: string }[];
}

export function ToolJsonLd({ tool, canonicalUrl, categoryName, faqs }: ToolJsonLdProps) {
  const faqList = faqs || (tool.faqs && tool.faqs.length > 0
    ? tool.faqs
    : tool.faq && tool.faq.length > 0
      ? tool.faq.map(item => ({ question: item.q, answer: item.a }))
      : []);

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: tool.seoTitle || tool.title || tool.name,
        description: tool.metaDescription || tool.shortDesc,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web browser",
        url: absolute(canonicalUrl),
        softwareVersion: "1.0",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
      ...(faqList.length > 0
        ? [
            {
              "@type": "FAQPage",
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
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "All Tools",
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
            item: absolute(canonicalUrl),
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
