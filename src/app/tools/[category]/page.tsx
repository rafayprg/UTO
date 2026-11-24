import Link from "next/link";
import { notFound } from "next/navigation";
import { categories, isCategory, toolPath } from "@/lib/tools-registry";
import { absolute } from "@/lib/site";
import { ToolBrowser } from "@/components/directory/ToolBrowser";
import { GuideSection } from "@/components/GuideSection";
import { CategoryHero } from "@/components/directory/CategoryHero";
import { PopularTools } from "@/components/directory/PopularTools";
import { TopicGrid } from "@/components/directory/TopicGrid";
import { categoryArt } from "@/lib/category-art";
import { categoryGuides, categoryFaqs } from "@/lib/guides";
import { categoryBlurbs, categoryKeys, categoryShortNames, popularIn, summarize, toolsIn } from "@/lib/published";

type Props = { params: Promise<{ category: string }> };

const POPULAR_COUNT = 6;

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
  const art = categoryArt(category);
  const images = art ? [{ url: absolute(art), width: 1600, height: 1000, alt: name }] : undefined;
  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    robots: { index: toolsIn(category).some((tool) => tool.indexable), follow: true },
    openGraph: { title, description, url: canonicalUrl, type: "website", images },
    twitter: { card: "summary_large_image", title, description, images },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  if (!isCategory(category)) notFound();
  const list = toolsIn(category);
  const summaries = list.map(summarize);
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
      <CategoryHero
        category={category}
        title={categories[category]}
        shortName={categoryShortNames[category]}
        lede={`${categoryBlurbs[category]} Every tool runs in your browser, so your numbers and files never leave your device.`}
        toolCount={list.length}
        topicCount={new Set(list.map((tool) => tool.group)).size}
        art={categoryArt(category)}
      />

      <PopularTools items={popularIn(category, POPULAR_COUNT).map(summarize)} />

      <TopicGrid items={summaries} categoryName={categoryShortNames[category]} />

      <h2 className="lt-alltools-heading">All {list.length.toLocaleString("en-US")} {categoryShortNames[category].toLowerCase()} tools</h2>
      <ToolBrowser items={summaries} label={categoryShortNames[category].toLowerCase()} />

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
