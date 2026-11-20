import { notFound } from "next/navigation";
import { categories, isCategory, tools, toolPath } from "@/lib/tools-registry";
import { absolute } from "@/lib/site";
import { ToolDirectory } from "@/components/ToolDirectory";
import { CategoryNav } from "@/components/CategoryNav";
import { PrivacyBadge } from "@/components/PrivacyBadge";
import { GuideSection } from "@/components/GuideSection";
import { CategoryIcon } from "@/components/ToolIcon";
import { categoryGuides, categoryFaqs } from "@/lib/guides";
export const dynamicParams = false;
export function generateStaticParams() { return Object.keys(categories).map(category => ({ category })); }
export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  if (!isCategory(category)) notFound();
  const name = categories[category];
  const title = `100% Free Online ${name} Tools (Private & No Sign Up)`;
  const description = `Explore ${name} tools running 100% inside your browser. Free, private, zero server uploads, and no sign up required.`;
  const canonicalUrl = absolute(`/tools/${category}/`);
  return {
    robots: {
      index: tools.some(tool => tool.category === category && tool.indexable),
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params; if (!isCategory(category)) notFound();
  const available = tools.filter(tool => tool.category === category);
  const live = available.filter(tool => tool.status === "live").length;
  const schema = { "@context":"https://schema.org", "@graph":[
    {"@type":"CollectionPage", name:categories[category], url:absolute(`/tools/${category}/`), mainEntity:{"@type":"ItemList", numberOfItems:available.length,itemListElement:available.map((tool,index)=>({"@type":"ListItem",position:index+1,name:tool.title,url:absolute(toolPath(tool))}))}},
    {"@type":"FAQPage",mainEntity:categoryFaqs[category].map(item=>({"@type":"Question",name:item.q,acceptedAnswer:{"@type":"Answer",text:item.a}}))}
  ] };
  return <div className="app-layout"><CategoryNav active={category}/><div className="hub-main category-page"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,"\\u003c")}}/><div className="page-intro"><span className={`tool-icon large ${category}`}><CategoryIcon category={category} size={30}/></span><p className="eyebrow">YOUR DEDICATED SUITE</p><h1>{categories[category]}</h1><p>One consistent workspace for useful tasks. {`${live} live ${live === 1 ? "tool" : "tools"} and ${available.length - live} coming soon, ${available.length} in total.`}</p></div><PrivacyBadge/><ToolDirectory key={category} category={category}/><GuideSection sections={categoryGuides[category]} title={`A practical guide to ${categories[category]}`}/><section className="content-section"><h2>Questions about this suite</h2>{categoryFaqs[category].map(item=><details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}</section></div></div>;
}
