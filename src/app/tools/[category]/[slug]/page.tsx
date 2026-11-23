import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ShieldCheck } from "lucide-react";
import { tools, getTool, toolPath, categories } from "@/lib/tools-registry";
import { getPost } from "@/lib/mdx";
import { absolute } from "@/lib/site";
import { ToolRenderer } from "@/components/tools/ToolRenderer";
import { AdSlot } from "@/components/AdSlot";
import { GuideSection } from "@/components/GuideSection";
import { toolGuideSections, toolFaq } from "@/lib/engine-guides";
import { ToolJsonLd } from "@/components/seo/ToolJsonLd";
import { categoryShortNames, publishedTools } from "@/lib/published";

type Props = { params: Promise<{ category: string; slug: string }> };
export const dynamicParams = false;

export function generateStaticParams() {
  const maxWave = Number(process.env.NEXT_PUBLIC_MAX_WAVE || 2);
  return tools
    .filter((tool) => (tool.publishWave ?? 1) <= maxWave)
    .map(({ category, slug }) => ({ category, slug }));
}

async function resolve(params: Props["params"]) {
  const { category, slug } = await params;
  const tool = getTool(slug);
  if (!tool || tool.category !== category) notFound();
  return tool;
}

export async function generateMetadata({ params }: Props) {
  const tool = await resolve(params);
  const title = tool.seoTitle || tool.title;
  const description = tool.metaDescription || tool.shortDesc;
  const canonicalUrl = absolute(toolPath(tool));

  return {
    title: {
      absolute: `${title} | Localtools`,
    },
    description,
    keywords: tool.keywords,
    robots: {
      index: tool.indexable,
      follow: true,
      googleBot: {
        index: tool.indexable,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} | Localtools`,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: "Localtools",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Localtools`,
      description,
    },
  };
}

export default async function ToolPage({ params }: Props) {
  const tool = await resolve(params);
  const post = tool.relatedBlogSlug ? getPost(tool.relatedBlogSlug) : undefined;
  
  const faqList = (tool.faqs && tool.faqs.length > 0)
    ? tool.faqs.map(f => ({ q: f.question, a: f.answer }))
    : (tool.faq && tool.faq.length > 0)
      ? tool.faq
      : toolFaq(tool);

  const sameSuite = publishedTools.filter(item => item.category === tool.category && item.id !== tool.id);
  // Same place first (e.g. other Texas tools), then the same group, then the rest of the category.
  const place = tool.slug.split("-")[0];
  const samePlace = publishedTools.filter(item => item.id !== tool.id && item.slug.split("-")[0] === place);
  const related = [...new Set([
    ...samePlace,
    ...sameSuite.filter(item => item.group === tool.group),
    ...sameSuite,
  ])].slice(0, 8);

  const assurances = [
    tool.engineType === "native" ? "Runs instantly in your browser" : "Files are processed on your device",
    "Nothing is uploaded or stored",
    "Free, no account needed",
  ];

  return (
    <article className="lt-wrap lt-tool">
      <ToolJsonLd
        tool={tool}
        canonicalUrl={toolPath(tool)}
        categoryName={categories[tool.category]}
        faqs={faqList.map(f => ({ question: f.q, answer: f.a }))}
      />

      <header className="lt-tool__head">
        <div>
          <nav className="lt-crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href={`/tools/${tool.category}/`}>{categoryShortNames[tool.category]}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{tool.group}</span>
          </nav>
          <h1>{tool.title}</h1>
          <p className="lt-tool__lede">{tool.shortDesc}</p>
        </div>
        <div className="lt-assure">
          {assurances.map(line => (
            <span key={line}>
              <Check size={16} strokeWidth={2.6} aria-hidden="true" /> {line}
            </span>
          ))}
        </div>
      </header>

      <section id="workspace" className="lt-bench" aria-label={`${tool.title} workspace`}>
        <div className="lt-bench__bar">
          <strong>
            <ShieldCheck size={16} aria-hidden="true" /> Private workspace
          </strong>
          <span>Closing this tab clears everything</span>
        </div>
        <div className="lt-bench__body">
          <ToolRenderer tool={tool}/>
        </div>
      </section>

      {(tool.componentKey === "background-remover" || tool.componentKey === "youtube-toolkit") && (
        <p className="lt-note">
          {tool.componentKey === "background-remover"
            ? "First use downloads the AI model and runtime from IMG.LY. Your image stays in this browser."
            : "Thumbnail previews request images from i.ytimg.com. Subtitle text is processed locally; no transcript-fetching service is used."}
        </p>
      )}

      <div className="lt-tool__layout">
        <div className="lt-prose">
          {tool.formulaExplanation && (
            <section id="formula" aria-labelledby="formula-title">
              <h2 id="formula-title">How it calculates</h2>
              <p className="lt-formula">{tool.formulaExplanation}</p>
            </section>
          )}

          {tool.workedExamples && tool.workedExamples.length > 0 && (
            <section id="examples" aria-labelledby="examples-title">
              <h2 id="examples-title">Worked examples</h2>
              <div className="lt-examples">
                {tool.workedExamples.map((ex, i) => (
                  <div key={i} className="lt-example">
                    <h3>{ex.title}</h3>
                    <p>{ex.inputSummary}</p>
                    <p><strong>{ex.resultSummary}</strong></p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <AdSlot/>

          <section>
            <GuideSection sections={toolGuideSections(tool)} title={`How to use the ${tool.name || tool.title}`}/>
          </section>

          <section id="faq" className="lt-faq" aria-labelledby="faq-title">
            <h2 id="faq-title">Questions people ask</h2>
            {faqList.map(item => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </section>

          <AdSlot/>
        </div>

        <aside className="lt-aside" aria-label="More on this tool">
          <div className="lt-aside__box lt-aside__guide">
            <h2>Want the full walkthrough?</h2>
            <p>Step-by-step instructions, the formulas behind the answer and common mistakes to avoid.</p>
            <Link href={`${toolPath(tool)}guide/`}>
              Read the guide
            </Link>
            {post && (
              <p style={{ marginTop: 12, marginBottom: 0 }}>
                <Link href={`/blog/${post.slug}/`}>{post.frontmatter.title}</Link>
              </p>
            )}
          </div>
          {related.length > 0 && (
            <div className="lt-aside__box">
              <h2>Related tools</h2>
              <nav>
                {related.map(item => (
                  <Link href={toolPath(item)} key={item.id}>
                    {item.title}
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </aside>
      </div>
    </article>
  );
}
