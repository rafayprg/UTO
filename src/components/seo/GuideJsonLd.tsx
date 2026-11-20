import React from "react";
import type { ToolDefinition } from "@/lib/tools-registry";
import type { ToolGuideContent } from "@/lib/tool-guide-content";
import { absolute } from "@/lib/site";

interface GuideJsonLdProps {
  tool: ToolDefinition;
  guide: ToolGuideContent;
  canonicalUrl: string;
  toolUrl: string;
  categoryName: string;
}

export function GuideJsonLd({ tool, guide, canonicalUrl, toolUrl, categoryName }: GuideJsonLdProps) {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        headline: guide.title,
        description: guide.metaDescription,
        url: absolute(canonicalUrl),
        inLanguage: "en-US",
        about: {
          "@type": "SoftwareApplication",
          name: tool.title,
          url: absolute(toolUrl),
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Web browser",
        },
        author: {
          "@type": "Organization",
          name: "Localtools Engineering",
          url: absolute("/"),
        },
        publisher: {
          "@type": "Organization",
          name: "Localtools",
          url: absolute("/"),
        },
      },
      {
        "@type": "HowTo",
        name: `How to Use ${tool.title}`,
        description: guide.metaDescription,
        step: guide.steps.map((s, idx) => ({
          "@type": "HowToStep",
          position: idx + 1,
          name: s.title,
          text: s.description,
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: guide.faqs.map(faq => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
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
            name: tool.title,
            item: absolute(toolUrl),
          },
          {
            "@type": "ListItem",
            position: 4,
            name: "Complete Guide",
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
