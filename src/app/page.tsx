import Link from "next/link";
import {
  ShieldCheck,
  ArrowRight,
  Zap,
  Sparkles,
  Check,
  Cpu,
  Lock,
  Globe2,
  Layers,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { ToolCard } from "@/components/ToolDirectory";
import { tools, type ToolCategory } from "@/lib/tools-registry";
import { CategoryIcon } from "@/components/ToolIcon";

export const metadata = {
  alternates: { canonical: "/" },
  title: "Localtools — 1,034+ 100% Free Private Browser Tools for Work, Code & Everyday Math",
  description: "One unified workspace of 1,034+ 100% free professional tools for PDFs, finance, code, media, and calculations. Zero server uploads. 100% private in-browser execution.",
};

const SUITE_HIGHLIGHTS: Array<{
  key: ToolCategory;
  name: string;
  desc: string;
  iconType: string;
}> = [
  {
    key: "finance",
    name: "Finance & Wealth",
    desc: "Mortgages, DIME life insurance, 401(k), auto refinance, and investment return models.",
    iconType: "calculator",
  },
  {
    key: "pdf",
    name: "PDF & Document Forge",
    desc: "Merge PDFs, redact confidential data, reorder pages, and convert documents locally.",
    iconType: "pdf",
  },
  {
    key: "dev",
    name: "Developer Utilities",
    desc: "JSON formatters, regex analyzers, JWT decoders, Base64 converters, and hash engines.",
    iconType: "dev",
  },
  {
    key: "image",
    name: "Image & Visual Media",
    desc: "In-browser AI background removal, HEIC/WebP conversions, SVG optimization, and compression.",
    iconType: "image",
  },
  {
    key: "calculator",
    name: "Calculators & Math",
    desc: "High-precision unit conversion, percentages, scientific formulas, and financial metrics.",
    iconType: "calculator",
  },
  {
    key: "business",
    name: "Business & Commerce",
    desc: "Amazon FBA fee estimators, Stripe payment calculator, SaaS churn/LTV, and ROAS models.",
    iconType: "data",
  },
];

export default function Home() {
  const trendingTools = tools.filter((t) => t.trending).slice(0, 8);

  return (
    <div className="landing-wrapper">
      {/* 1. HERO SECTION */}
      <section className="landing-hero">
        <div className="landing-hero-badge">
          <span className="green-dot" />
          <span>100% PRIVATE · CLIENT-SIDE COMPUTATION · ZERO SERVER UPLOADS</span>
        </div>

        <h1 className="landing-hero-title">
          1,034+ Professional Tools.
          <br />
          <span className="hero-gradient-text">Zero Data Leaves Your Device.</span>
        </h1>

        <p className="landing-hero-subtitle">
          Transform PDFs, calculate financial plans, format code, and optimize images directly
          inside your browser. Powered by client-side WebAssembly and modern web APIs. No accounts,
          no paywalls, and no server tracking.
        </p>

        <div className="landing-hero-actions">
          <Link href="/tools/" className="button large hero-primary-btn">
            Explore All 1,034 Tools <ArrowRight size={18} />
          </Link>
          <Link href="/blog/" className="button secondary large">
            Read Dedicated Guides <BookOpen size={16} />
          </Link>
        </div>

        {/* STATS STRIP */}
        <div className="landing-stats-strip">
          <div className="landing-stat">
            <strong>1,034</strong>
            <span>Browser-Native Tools</span>
          </div>
          <div className="landing-stat">
            <strong>20</strong>
            <span>Specialized Suites</span>
          </div>
          <div className="landing-stat">
            <strong>0 KB</strong>
            <span>Sent to Servers</span>
          </div>
          <div className="landing-stat">
            <strong>100%</strong>
            <span>Free & Account-Free</span>
          </div>
        </div>
      </section>

      {/* 2. CORE VALUE PILLARS */}
      <section className="landing-section pillars-section">
        <div className="section-head text-center">
          <p className="eyebrow"><ShieldCheck size={14} /> BUILT FOR PRIVACY & SPEED</p>
          <h2>Why Local-First Computing Wins</h2>
          <p className="section-subtext">
            Traditional web tools upload your sensitive contracts, tax numbers, and personal images to remote clouds.
            Localtools executes entirely inside your browser sandbox.
          </p>
        </div>

        <div className="pillars-grid">
          <div className="pillar-card">
            <div className="pillar-icon bg-emerald">
              <Lock size={22} />
            </div>
            <h3>Bank-Grade Data Privacy</h3>
            <p>
              Your tax forms, proprietary source code, and family photos never touch an external server.
              Computations happen in-memory on your device.
            </p>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon bg-blue">
              <Zap size={22} />
            </div>
            <h3>Zero Upload Latency</h3>
            <p>
              No more waiting for 50MB files to upload across sluggish internet connections.
              Operations execute instantly using your computer’s CPU and GPU.
            </p>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon bg-purple">
              <Globe2 size={22} />
            </div>
            <h3>Works Completely Offline</h3>
            <p>
              Once a page is loaded, disconnect your Wi-Fi or go into airplane mode.
              Calculations, text transformations, and converters continue running seamlessly.
            </p>
          </div>

          <div className="pillar-card">
            <div className="pillar-icon bg-orange">
              <Check size={22} />
            </div>
            <h3>No Accounts or Paywalls</h3>
            <p>
              No signups, no credit cards, no monthly token limits, and no obnoxious watermarks.
              Direct utility ready the second you open the page.
            </p>
          </div>
        </div>
      </section>

      {/* 3. POPULAR SUITES SHOWCASE */}
      <section className="landing-section suites-section">
        <div className="section-head">
          <div>
            <p className="eyebrow"><Layers size={14} /> ORGANIZED FOR SPEED</p>
            <h2>Explore Our Tool Suites</h2>
            <p className="section-subtext">
              20 tailored categories designed for developers, accountants, designers, and students.
            </p>
          </div>
          <Link href="/tools/" className="text-link">
            View All 20 Suites <ArrowRight size={15} />
          </Link>
        </div>

        <div className="suites-grid">
          {SUITE_HIGHLIGHTS.map((suite) => {
            const count = tools.filter((t) => t.category === suite.key).length;
            return (
              <Link
                key={suite.key}
                href={`/tools/${suite.key}/`}
                className="suite-card"
              >
                <div className="suite-card-top">
                  <span className={`tool-icon ${suite.iconType}`}>
                    <CategoryIcon category={suite.key} size={22} />
                  </span>
                  <span className="count-badge">{count} tools</span>
                </div>
                <h3>{suite.name}</h3>
                <p>{suite.desc}</p>
                <span className="suite-explore-link">
                  Open suite <ChevronRight size={14} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. TRENDING / LAUNCH COLLECTION */}
      <section className="landing-section trending-landing-section">
        <div className="section-head">
          <div>
            <p className="eyebrow"><Sparkles size={14} /> POPULAR NOW</p>
            <h2>Trending Client-Side Tools</h2>
            <p className="section-subtext">
              Our flagship tools for everyday calculation, media conversion, and document editing.
            </p>
          </div>
          <Link href="/tools/" className="button secondary">
            Browse All 1,034 <ArrowRight size={15} />
          </Link>
        </div>

        <div className="trending-grid">
          {trendingTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section className="landing-section how-it-works-section">
        <div className="section-head text-center">
          <p className="eyebrow"><Cpu size={14} /> SIMPLE & SECURE</p>
          <h2>How Localtools Works</h2>
          <p className="section-subtext">
            Three straightforward steps to private, high-speed productivity.
          </p>
        </div>

        <div className="how-steps-grid">
          <div className="how-step-card">
            <div className="how-step-num">01</div>
            <h3>Select Any Tool</h3>
            <p>
              Use our quick command palette (<kbd>Ctrl + K</kbd>) or directory to choose from 1,034+
              specialized utilities across 20 suites.
            </p>
          </div>

          <div className="how-step-card">
            <div className="how-step-num">02</div>
            <h3>Process Privately</h3>
            <p>
              Drop in your files, adjust parameters, or run calculations. Everything executes locally in
              isolated browser memory with WebAssembly.
            </p>
          </div>

          <div className="how-step-card">
            <div className="how-step-num">03</div>
            <h3>Export Clean Results</h3>
            <p>
              Download redacted PDFs, copy formatted code, or review financial schedules instantly
              without watermarks or server delays.
            </p>
          </div>
        </div>
      </section>

      {/* 6. DEDICATED GUIDES & SPECIFICATIONS HIGHLIGHT */}
      <section className="landing-section guides-highlight-section">
        <div className="guides-highlight-card">
          <div className="guides-highlight-content">
            <p className="eyebrow text-white"><BookOpen size={14} /> KNOWLEDGE & SPECIFICATIONS</p>
            <h2>Every Single Tool Has Its Own Complete Guide.</h2>
            <p>
              We don&apos;t just give you a blank box. Each of our 1,034 tools features an in-depth
              technical specification, mathematical formula breakdown, real-world worked examples,
              and step-by-step best practices.
            </p>
            <div className="guides-highlight-actions">
              <Link href="/blog/" className="button hero-light-btn">
                Browse Guide Library <ArrowRight size={16} />
              </Link>
              <Link href="/tools/insurance/life-insurance-calculator/guide/" className="text-link text-white">
                View Sample Guide &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS */}
      <section className="landing-section faqs-section">
        <div className="section-head text-center">
          <p className="eyebrow">CLEAR ANSWERS</p>
          <h2>Frequently Asked Questions</h2>
        </div>

        <div className="landing-faqs-container">
          <details className="faq-accordion">
            <summary>Are my files or calculations ever uploaded to your servers?</summary>
            <p>
              No. Never. Every single tool operates entirely in your browser using JavaScript and
              WebAssembly. When you drag and drop a PDF, format private code, or enter sensitive financial
              numbers, the data never leaves your device’s memory.
            </p>
          </details>

          <details className="faq-accordion">
            <summary>Why do you offer 1,034+ tools for free without mandatory accounts?</summary>
            <p>
              Because client-side architecture costs virtually zero in heavy server compute. Since your
              machine does the processing, we don’t need multi-million dollar GPU clusters to process your
              files. We believe essential productivity tools should be open, private, and accessible to everyone.
            </p>
          </details>

          <details className="faq-accordion">
            <summary>Can I use these tools completely offline?</summary>
            <p>
              Yes! Once a tool page is loaded in your browser cache, you can disconnect your Wi-Fi, board
              an airplane, or work in an air-gapped security room. The calculation logic, converters, and
              formatters will continue working uninterrupted.
            </p>
          </details>

          <details className="faq-accordion">
            <summary>How accurate are the financial, mortgage, and math tools?</summary>
            <p>
              Our calculators are built using industry-standard formulas (such as standard amortization schedules,
              the DIME method for life insurance, and official tax brackets). Each tool includes a dedicated
              &quot;How it calculates&quot; formula section and worked examples so you can verify every step.
            </p>
          </details>

          <details className="faq-accordion">
            <summary>Where can I see the full directory of tools?</summary>
            <p>
              You can access the complete interactive directory anytime by clicking &quot;All Tools&quot; in the header
              or visiting <Link href="/tools/">/tools/</Link>. You can also press <kbd>Ctrl + K</kbd> to search
              instantly from any page.
            </p>
          </details>
        </div>
      </section>

      {/* 8. BOTTOM CALL TO ACTION */}
      <section className="landing-cta-banner">
        <h2>Ready for a Faster, 100% Private Workspace?</h2>
        <p>
          Join thousands of professionals working smarter with client-side tools that never compromise your privacy.
        </p>
        <div className="cta-actions">
          <Link href="/tools/" className="button large">
            Open All 1,034 Tools & Apps <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </div>
  );
}
