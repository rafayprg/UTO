import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Clock,
  HelpCircle,
  Layers,
} from "lucide-react";
import { tools, getTool, toolPath, categories } from "@/lib/tools-registry";
import { absolute } from "@/lib/site";
import { generateToolGuide } from "@/lib/tool-guide-content";
import { GuideJsonLd } from "@/components/seo/GuideJsonLd";
import { AdSlot } from "@/components/AdSlot";
import { CiteWidget } from "@/components/CiteWidget";

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
  const guide = generateToolGuide(tool);
  const canonicalUrl = `${toolPath(tool)}guide/`;
  return {
    title: {
      absolute: `${guide.title} | Localtools`,
    },
    description: guide.metaDescription,
    keywords: [...tool.keywords, "guide", "tutorial", "how to use", "formula", "worked examples", "calculator guide"],
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: `${guide.title} | Localtools`,
      description: guide.metaDescription,
      url: absolute(canonicalUrl),
      type: "article",
    },
  };
}

export default async function ToolGuidePage({ params }: Props) {
  const tool = await resolve(params);
  const guide = generateToolGuide(tool);
  const toolUrl = toolPath(tool);
  const guideUrl = `${toolUrl}guide/`;
  const categoryName = categories[tool.category] || tool.category;

  const sameSuite = tools
    .filter((item) => item.category === tool.category && item.slug !== tool.slug)
    .slice(0, 6);

  return (
    <article className="page-container guide-page">
      <GuideJsonLd
        tool={tool}
        guide={guide}
        canonicalUrl={guideUrl}
        toolUrl={toolUrl}
        categoryName={categoryName}
      />

      <nav aria-label="Breadcrumb" className="guide-breadcrumbs">
        <Link href="/" className="back-link">Home</Link>
        <span className="crumb-sep">/</span>
        <Link href={`/tools/${tool.category}/`} className="back-link">{categoryName}</Link>
        <span className="crumb-sep">/</span>
        <Link href={toolUrl} className="back-link">{tool.title}</Link>
        <span className="crumb-sep">/</span>
        <span className="crumb-current">Complete Guide</span>
      </nav>

      <header className="guide-hero">
        <div className="guide-hero-badge-row">
          <span className="guide-eyebrow">
            <BookOpen size={13} /> PRACTICAL TUTORIAL & FORMULA GUIDE · {tool.group.toUpperCase()}
          </span>
          <span className="guide-reading-time">
            <Clock size={13} /> {guide.readingTimeMinutes} min read · 100% Client-Side
          </span>
        </div>

        <h1>Complete Guide to {tool.title}</h1>
        <p className="guide-lead">{guide.overview.lead}</p>

        <div className="guide-cta-banner">
          <div className="guide-cta-text">
            <strong>Ready to run this tool right now?</strong>
            <span>All calculations, conversions, and parsing run 100% inside your browser with zero server uploads.</span>
          </div>
          <Link href={toolUrl} className="button">
            Launch {tool.title} <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      <nav className="guide-toc" aria-label="Table of Contents">
        <span className="toc-title"><Layers size={14} /> ON THIS PAGE:</span>
        <a href="#overview">Overview</a>
        <a href="#tutorial">Step-by-Step</a>
        <a href="#formula">Formula & Methodology</a>
        <a href="#examples">Worked Scenarios</a>
        <a href="#best-practices">Best Practices</a>
        <a href="#pitfalls">Common Pitfalls</a>
        <a href="#faqs">FAQs</a>
      </nav>

      {/* 1. Overview */}
      <section id="overview" className="guide-section">
        <div className="section-header">
          <span className="eyebrow">ESSENTIAL BACKGROUND</span>
          <h2>Overview & Core Concept</h2>
        </div>
        {guide.overview.paragraphs.map((p, i) => (
          <p key={i} className="guide-paragraph">{p}</p>
        ))}

        <div className="key-takeaways-card">
          <div className="takeaway-header">
            <Sparkles size={16} />
            <h3>Key Takeaways & Architectural Highlights</h3>
          </div>
          <ul>
            {guide.overview.keyTakeaways.map((item, i) => (
              <li key={i}>
                <CheckCircle2 size={15} className="check-icon" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 2. Step-by-Step Tutorial */}
      <section id="tutorial" className="guide-section">
        <div className="section-header">
          <span className="eyebrow">STEP-BY-STEP INSTRUCTIONS</span>
          <h2>How to Use {tool.title}</h2>
          <p>Follow these 4 structured steps to execute your calculation or data transformation with verified accuracy.</p>
        </div>

        <div className="steps-container">
          {guide.steps.map((step) => (
            <div key={step.stepNumber} className="step-card">
              <div className="step-badge">{step.stepNumber}</div>
              <div className="step-content">
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                <div className="step-protip">
                  <strong>Pro Tip:</strong> {step.proTip}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <AdSlot />

      {/* 3. Mathematical Formula / Algorithmic Logic */}
      <section id="formula" className="guide-section">
        <div className="section-header">
          <span className="eyebrow">MATHEMATICAL & TECHNICAL LOGIC</span>
          <h2>{guide.formulaAndLogic.heading}</h2>
          <p>{guide.formulaAndLogic.explanation}</p>
        </div>

        <div className="formula-display-card">
          <span className="formula-tag">PRIMARY FORMULA / ALGORITHM</span>
          <code className="formula-code">{guide.formulaAndLogic.formula}</code>
          {guide.formulaAndLogic.standardOrReference && (
            <p className="formula-ref">
              <strong>Governing Standard / Authority:</strong> {guide.formulaAndLogic.standardOrReference}
            </p>
          )}
        </div>

        {guide.formulaAndLogic.variables.length > 0 && (
          <div className="variables-table-wrapper">
            <h3>Variables & Parameter Definitions</h3>
            <table className="variables-table">
              <thead>
                <tr>
                  <th>Variable / Parameter</th>
                  <th>Definition & Purpose</th>
                  <th>Dimensional Unit</th>
                </tr>
              </thead>
              <tbody>
                {guide.formulaAndLogic.variables.map((v, i) => (
                  <tr key={i}>
                    <td><code>{v.name}</code></td>
                    <td>{v.definition}</td>
                    <td><span className="unit-pill">{v.unit || "N/A"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 4. Real-World Worked Scenarios */}
      <section id="examples" className="guide-section">
        <div className="section-header">
          <span className="eyebrow">REAL-WORLD VERIFICATION</span>
          <h2>Worked Scenarios & Calculations</h2>
          <p>Examine concrete examples demonstrating input configurations and the resulting verified output.</p>
        </div>

        <div className="scenarios-grid">
          {guide.workedExamples.map((ex, i) => (
            <div key={i} className="scenario-card">
              <span className="scenario-tag">CASE STUDY {i + 1}</span>
              <h3>{ex.scenarioTitle}</h3>
              <p className="scenario-context">{ex.context}</p>

              <div className="scenario-box">
                <h4>Input Parameters:</h4>
                <ul>
                  {ex.inputs.map((inp, idx) => (
                    <li key={idx}><strong>{inp.label}:</strong> {inp.value}</li>
                  ))}
                </ul>
              </div>

              <div className="scenario-steps">
                <h4>Calculation Breakdown:</h4>
                <ol>
                  {ex.calculationSteps.map((st, idx) => (
                    <li key={idx}>{st}</li>
                  ))}
                </ol>
              </div>

              <div className="scenario-result">
                <strong>Result:</strong> {ex.result}
              </div>

              <p className="scenario-analysis">{ex.analysis}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Best Practices */}
      <section id="best-practices" className="guide-section">
        <div className="section-header">
          <span className="eyebrow">PROFESSIONAL WORKFLOW RECOMMENDATIONS</span>
          <h2>Best Practices & Expert Tips</h2>
        </div>

        <div className="best-practices-grid">
          {guide.bestPractices.map((bp, i) => (
            <div key={i} className="best-practice-card">
              <div className="bp-icon"><ShieldCheck size={20} /></div>
              <h3>{bp.title}</h3>
              <p>{bp.advice}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Common Pitfalls to Avoid */}
      <section id="pitfalls" className="guide-section">
        <div className="section-header">
          <span className="eyebrow">AVOID COMMON ERRORS</span>
          <h2>Common Pitfalls & Mistakes</h2>
        </div>

        <div className="pitfalls-grid">
          {guide.commonPitfalls.map((pf, i) => (
            <div key={i} className="pitfall-card">
              <div className="pitfall-top">
                <AlertCircle size={18} className="warn-icon" />
                <h3>{pf.mistake}</h3>
              </div>
              <p className="pitfall-consequence"><strong>Risk:</strong> {pf.consequence}</p>
              <p className="pitfall-solution"><strong>Fix:</strong> {pf.solution}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Frequently Asked Questions */}
      <section id="faqs" className="guide-section">
        <div className="section-header">
          <span className="eyebrow">FREQUENTLY ASKED QUESTIONS</span>
          <h2>Questions & Answers</h2>
        </div>

        <div className="faqs-list">
          {guide.faqs.map((faq, i) => (
            <details key={i} className="faq-item">
              <summary>
                <HelpCircle size={16} />
                <span>{faq.question}</span>
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <AdSlot />

      {/* Bottom Conversion Card */}
      <div className="guide-bottom-cta">
        <span className="green-dot" />
        <h2>Execute {tool.title} in Your Browser</h2>
        <p>
          Experience instant calculation speed with zero server uploads. Your data stays 100% private in local device memory.
        </p>
        <Link href={toolUrl} className="button large">
          Open {tool.title} Live Workspace <ArrowRight size={17} />
        </Link>
      </div>

      {/* Organic Backlink & Citation Generator */}
      <CiteWidget
        title={`Complete Guide to ${tool.title}`}
        url={absolute(guideUrl)}
        authorName="LocalTools Technical Editorial Board"
        publishedYear="2026"
      />

      {/* Related Tools */}
      {sameSuite.length > 0 && (
        <footer className="guide-related-footer">
          <span className="eyebrow">RELATED TOOLS IN {categoryName.toUpperCase()}</span>
          <h3>Explore More Tools in this Category</h3>
          <div className="related-tools-grid">
            {sameSuite.map((item) => (
              <Link href={toolPath(item)} key={item.id} className="related-tool-pill">
                <span>{item.title}</span>
                <ArrowUpRight size={13} />
              </Link>
            ))}
          </div>
        </footer>
      )}
    </article>
  );
}
