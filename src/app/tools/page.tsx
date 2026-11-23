import type { Metadata } from "next";
import Link from "next/link";
import { CategoryIcon } from "@/components/ToolIcon";
import { SearchTrigger } from "@/components/layout/SearchDialog";
import { site, absolute } from "@/lib/site";
import { toolPath } from "@/lib/tools-registry";
import { categoryBlurbs, categoryKeys, categoryShortNames, popularIn, publishedTools, toolsIn } from "@/lib/published";

const total = publishedTools.length.toLocaleString("en-US");

export const metadata: Metadata = {
  title: { absolute: `All ${total} Free Online Tools — Private, No Sign-Up | Localtools` },
  description: `Browse ${total} free tools in 15 categories: tax and paycheck calculators for every state, PDF and image tools, legal documents and more. All run in your browser.`,
  alternates: { canonical: "/tools/" },
  openGraph: {
    title: `All ${total} Free Online Tools | Localtools`,
    description: `${total} free browser tools. No uploads, no sign-up.`,
    url: absolute("/tools/"),
    siteName: site.name,
    locale: "en_US",
    type: "website",
  },
};

export default function ToolsDirectoryPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": absolute("/tools/#webpage"),
        url: absolute("/tools/"),
        name: `All ${total} free online tools`,
        isPartOf: { "@type": "WebSite", "@id": absolute("/#website"), name: site.name, url: absolute("/") },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absolute("/") },
          { "@type": "ListItem", position: 2, name: "All tools", item: absolute("/tools/") },
        ],
      },
    ],
  };

  return (
    <div className="lt-wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header className="lt-page-head">
        <nav className="lt-crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">All tools</span>
        </nav>
        <h1>All {total} tools, in 15 categories.</h1>
        <p className="lt-page-head__lede">Search by what you want to do, or open a category to see everything in it.</p>
        <SearchTrigger className="lt-hero__search" count={publishedTools.length} label="Search by task, like “sales tax” or “split pdf”">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </SearchTrigger>
      </header>

      <div className="lt-catgrid" style={{ marginTop: 16 }}>
        {categoryKeys.map((key) => (
          <div className="lt-catcard" key={key}>
            <span className="lt-glyph">
              <CategoryIcon category={key} size={18} />
            </span>
            <h2>
              <Link href={`/tools/${key}/`}>{categoryShortNames[key]}</Link>
            </h2>
            <p>{categoryBlurbs[key]}</p>
            <div className="lt-index__tools" style={{ marginTop: 0 }}>
              {popularIn(key, 3).map((tool) => (
                <Link key={tool.id} href={toolPath(tool)}>
                  {tool.name || tool.title}
                </Link>
              ))}
            </div>
            <small>
              <Link href={`/tools/${key}/`}>See all {toolsIn(key).length}</Link>
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}
