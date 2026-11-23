import Link from "next/link";
import { notFound } from "next/navigation";
import { categories, isCategory, toolPath } from "@/lib/tools-registry";
import { absolute } from "@/lib/site";
import { ToolBrowser } from "@/components/directory/ToolBrowser";
import { GuideSection } from "@/components/GuideSection";
import { CategoryIcon } from "@/components/ToolIcon";
import { categoryGuides, categoryFaqs } from "@/lib/guides";
import { categoryBlurbs, categoryKeys, categoryShortNames, summarize, toolsIn } from "@/lib/published";

type Props = { params: Promise<{ category: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return categoryKeys.map((category) => ({ category }));
}

export async function generateMetadata({ params }: Props) {
  const { category } = await params;
  if (!isCategory(category)) notFound();
  const name = categories[category];
  const title = `${name} — Free & Private, No Sign-Up`;
  const description = `${toolsIn(category).length} free ${categoryShortNames[category].toLowerCase()} tools that run in your browser. ${categoryBlurbs[category]} Nothing is uploaded.`;
  const canonicalUrl = absolute(`/tools/${category}/`);
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    robots: { index: toolsIn(category).some((tool) => tool.indexable), follow: true },
    openGraph: { title, description, url: canonicalUrl, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  if (!isCategory(category)) notFound();
  const list = toolsIn(category);
  const faqs = categoryFaqs[category];

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: categories[category],
        url: absolute(`/tools/${category}/`),
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: list.length,
          itemListElement: list.map((tool, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: tool.title,
            url: absolute(toolPath(tool)),
          })),
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absolute("/") },
          { "@type": "ListItem", position: 2, name: "All tools", item: absolute("/tools/") },
          { "@type": "ListItem", position: 3, name: categoryShortNames[category], item: absolute(`/tools/${category}/`) },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };

  return (
    <div className="lt-wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
      <header className="lt-page-head">
        <nav className="lt-crumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/tools/">All tools</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{categoryShortNames[category]}</span>
        </nav>
        <div className="lt-page-head__title">
          <span className="lt-glyph lt-glyph--lg">
            <CategoryIcon category={category} size={26} />
          </span>
          <h1>{categories[category]}</h1>
        </div>
        <p className="lt-page-head__lede">
          {list.length} free tools. {categoryBlurbs[category]} Everything runs in your browser.
        </p>
      </header>

      <ToolBrowser items={list.map(summarize)} label={categoryShortNames[category].toLowerCase()} />

      <div className="lt-tool__layout">
        <div className="lt-prose">
          <GuideSection sections={categoryGuides[category]} title={`Getting good results with ${categoryShortNames[category].toLowerCase()} tools`} />
          <section className="lt-faq" aria-labelledby="category-faq" style={{ marginTop: 48 }}>
            <h2 id="category-faq">Questions people ask</h2>
            {faqs.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </section>
        </div>
        <aside className="lt-aside" aria-label="Other categories">
          <div className="lt-aside__box">
            <h2>Other categories</h2>
            <nav>
              {categoryKeys
                .filter((key) => key !== category)
                .map((key) => (
                  <Link key={key} href={`/tools/${key}/`}>
                    {categoryShortNames[key]}
                  </Link>
                ))}
            </nav>
          </div>
        </aside>
      </div>
    </div>
  );
}
