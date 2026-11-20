import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen } from "lucide-react";
import { tools, getTool, toolPath, categories } from "@/lib/tools-registry";
import { getPost } from "@/lib/mdx";
import { absolute } from "@/lib/site";
import { ToolRenderer } from "@/components/tools/ToolRenderer";
import { ToolIcon } from "@/components/ToolIcon";
import { AdSlot } from "@/components/AdSlot";
import { PrivacyBadge } from "@/components/PrivacyBadge";
import { GuideSection } from "@/components/GuideSection";
import { toolGuideSections, toolFaq } from "@/lib/engine-guides";
import { ToolJsonLd } from "@/components/seo/ToolJsonLd";

type Props = { params: Promise<{ category: string; slug: string }> };
export const dynamicParams = false;

export function generateStaticParams() {
  return tools.map(({ category, slug }) => ({ category, slug }));
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
  return {
    robots: { index: tool.indexable, follow: true },
    title,
    description,
    keywords: tool.keywords,
    alternates: { canonical: toolPath(tool) },
    openGraph: {
      title,
      description,
      url: absolute(toolPath(tool)),
      type: "website",
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

  const sameSuite = tools.filter(item => item.category === tool.category && item.id !== tool.id);
  const related = [...sameSuite.filter(item => item.group === tool.group), ...sameSuite.filter(item => item.group !== tool.group)]
    .sort((a, b) => Number(b.status === "live") - Number(a.status === "live"))
    .slice(0, 8);

  return (
    <article className="page-container tool-page">
      <ToolJsonLd
        tool={tool}
        canonicalUrl={toolPath(tool)}
        categoryName={categories[tool.category]}
        faqs={faqList.map(f => ({ question: f.q, answer: f.a }))}
      />
      <Link href={`/tools/${tool.category}/`} className="back-link">
        <ArrowLeft size={15}/> {categories[tool.category]}
      </Link>
      <div className="tool-intro">
        <span className={`tool-icon large ${tool.category}`}>
          <ToolIcon tool={tool} size={30}/>
        </span>
        <div>
          <p className="eyebrow">
            {tool.status === "planned"
              ? "COMING SOON"
              : tool.cpcTier === "high"
                ? "HIGH-CPC AUDIENCE TOOL · 100% PRIVATE"
                : tool.indexable
                  ? "WAVE 1 · FREE BROWSER TOOL"
                  : "FREE BROWSER TOOL"} · {tool.group}
          </p>
          <h1>{tool.title}</h1>
          <p>{tool.shortDesc}</p>
        </div>
      </div>
      <div className="workspace-meta">
        <PrivacyBadge/>
        <nav aria-label="On this page">
          <a href="#workspace">Workspace</a>
          <a href="#specs">Specifications</a>
          {tool.formulaExplanation && <a href="#formula">Formula</a>}
          {tool.workedExamples && tool.workedExamples.length > 0 && <a href="#examples">Examples</a>}
          <a href="#guide">How to use</a>
          <a href="#faq">FAQs</a>
          <Link href={`${toolPath(tool)}guide/`}>Full Guide &rarr;</Link>
        </nav>
      </div>
      
      <section id="workspace" className="tool-workspace" aria-label={`${tool.title} workspace`}>
        <div className="workspace-title">
          <span className="green-dot"/> YOUR LOCAL WORKSPACE <span>No account required</span>
        </div>
        <ToolRenderer tool={tool}/>
      </section>

      {(tool.componentKey === "background-remover" || tool.componentKey === "youtube-toolkit") && (
        <p className="network-note">
          {tool.componentKey === "background-remover"
            ? "First use downloads the AI model and runtime from IMG.LY. Your image stays in this browser."
            : "Thumbnail previews request images from i.ytimg.com. Subtitle text is processed locally; no transcript-fetching service is used."}
        </p>
      )}

      <section id="specs" className="tool-specs-section content-section" aria-label="Technical Specifications">
        <p className="eyebrow">TECHNICAL SPECIFICATIONS</p>
        <h2>Tool Architecture & Specifications</h2>
        <div className="specs-table-container">
          <table className="specs-table">
            <tbody>
              <tr>
                <th>Execution Model</th>
                <td>Client-Side In-Browser ({tool.isWasm ? "Compiled WebAssembly Sandbox" : "Native V8 JavaScript Engine"})</td>
              </tr>
              <tr>
                <th>Data Ingestion & Privacy</th>
                <td>100% Zero-Upload · Air-Gapped Local Computation</td>
              </tr>
              <tr>
                <th>Processing Engine</th>
                <td>{tool.engineType === "wasm" ? "WebAssembly (WASM) / Web Workers" : tool.engineType === "client" ? "HTML5 Canvas & Web API Sandbox" : "High-Precision Mathematical Engine"}</td>
              </tr>
              <tr>
                <th>Category Suite</th>
                <td>{categories[tool.category]} · {tool.group}</td>
              </tr>
              <tr>
                <th>Operational Status</th>
                <td>{tool.status === "live" ? "Active / Full Execution" : "Staged Sandbox"}</td>
              </tr>
              <tr>
                <th>Supported Data Types</th>
                <td>{tool.keywords.slice(0, 5).join(", ")}</td>
              </tr>
              <tr>
                <th>Network Dependency</th>
                <td>100% Offline Capable (No third-party cookies, tracking, or remote APIs)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {tool.formulaExplanation && (
        <section id="formula" className="formula-section content-section" aria-label="Formula and calculation logic">
          <p className="eyebrow">MATHEMATICAL LOGIC & FORMULA</p>
          <h2>How it calculates</h2>
          <div className="formula-box">
            <p>{tool.formulaExplanation}</p>
          </div>
        </section>
      )}

      {tool.workedExamples && tool.workedExamples.length > 0 && (
        <section id="examples" className="worked-examples-section content-section" aria-label="Worked examples">
          <p className="eyebrow">REAL-WORLD CALCULATIONS</p>
          <h2>Worked examples</h2>
          <div className="examples-grid">
            {tool.workedExamples.map((ex, i) => (
              <div key={i} className="example-card">
                <h3>{ex.title}</h3>
                <p className="example-input"><strong>Scenario:</strong> {ex.inputSummary}</p>
                <p className="example-result"><strong>Result:</strong> {ex.resultSummary}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <AdSlot/>
      
      <div className="guide-banner">
        <div>
          <span className="eyebrow">COMPREHENSIVE TUTORIAL & FORMULAS</span>
          <h2>In-Depth Guide to {tool.title}</h2>
          <p>Explore our complete step-by-step walkthrough, mathematical methodology, worked real-world scenarios, and expert tips.</p>
        </div>
        <Link href={`${toolPath(tool)}guide/`} className="button">
          Read Full Guide <ArrowRight size={15}/>
        </Link>
      </div>

      <div className="guide-layout">
        <GuideSection sections={toolGuideSections(tool)} title={`How to use ${tool.title}`}/>
        <aside className="guide-aside">
          <BookOpen size={23}/>
          <h3>A useful result starts with a quick check.</h3>
          <p>Review the preview and keep your originals. Local processing protects your files from server uploads; it does not replace checking the output.</p>
          <Link href={`${toolPath(tool)}guide/`} className="text-link" style={{ fontWeight: 600, color: "#1d4ed8" }}>
            Read the complete guide <ArrowUpRight size={15}/>
          </Link>
          {post && (
            <Link href={`/blog/${post.slug}/`} className="text-link">
              Read the companion blog guide <ArrowUpRight size={15}/>
            </Link>
          )}
          {related.length > 0 && (
            <>
              <h3>Also in this suite</h3>
              {related.map(item => (
                <Link href={toolPath(item)} key={item.id}>
                  {item.title}{item.status === "planned" ? " (soon)" : ""} <ArrowUpRight size={13}/>
                </Link>
              ))}
            </>
          )}
        </aside>
      </div>

      <section id="faq" className="content-section">
        <p className="eyebrow">A FEW USEFUL ANSWERS</p>
        <h2>Frequently asked questions</h2>
        {faqList.map(item => (
          <details key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </section>

      {post && (
        <section className="embed">
          <p className="eyebrow">THE COMPANION GUIDE</p>
          <h2>{post.frontmatter.title}</h2>
          <p>{post.frontmatter.description}</p>
          <Link className="text-link" href={`/blog/${post.slug}/`}>
            Read the guide <ArrowUpRight size={15}/>
          </Link>
        </section>
      )}
      
      <AdSlot/>
    </article>
  );
}
