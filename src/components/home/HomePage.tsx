import Link from "next/link";
import { CategoryIcon } from "@/components/ToolIcon";
import { SearchTrigger } from "@/components/layout/SearchDialog";
import { US_STATES } from "@/data/programmatic/us-states";
import { getTool, toolPath, type ToolDefinition } from "@/lib/tools-registry";
import { categoryBlurbs, categoryKeys, categoryShortNames, popularIn, publishedTools, toolsIn } from "@/lib/published";
import { PaycheckDemo } from "./PaycheckDemo";
import { PrivacyDiagram } from "./PrivacyDiagram";
import { StatePicker, type StateMode } from "./StatePicker";

const QUICK_LINKS = [
  { slug: "mortgage-calculator", label: "Mortgage" },
  { slug: "pdf-merger", label: "Merge PDF" },
  { slug: "background-remover", label: "Remove background" },
  { slug: "json-formatter", label: "Format JSON" },
  { slug: "word-counter", label: "Word count" },
];
const POPULAR_SLUGS = [
  "texas-paycheck-calculator",
  "mortgage-calculator",
  "pdf-merger",
  "background-remover",
  "california-income-tax-calculator",
  "json-formatter",
  "percentage-calculator",
  "word-counter",
  "florida-car-insurance-calculator",
];

const STATE_MODES: Array<{ key: string; label: string; suffix: string }> = [
  { key: "paycheck", label: "Paycheck", suffix: "paycheck-calculator" },
  { key: "income", label: "Income tax", suffix: "income-tax-calculator" },
  { key: "sales", label: "Sales tax", suffix: "sales-tax-calculator" },
  { key: "car", label: "Car insurance", suffix: "car-insurance-calculator" },
  { key: "nda", label: "NDA", suffix: "non-disclosure-agreement" },
];

function resolve(slugs: string[]): ToolDefinition[] {
  return slugs.flatMap((slug) => {
    const tool = getTool(slug);
    return tool && publishedTools.includes(tool) ? [tool] : [];
  });
}

function stateModes(): StateMode[] {
  return STATE_MODES.map(({ key, label, suffix }) => ({
    key,
    label,
    links: US_STATES.flatMap((state) => {
      const tool = getTool(`${state.slug}-${suffix}`);
      return tool ? [{ code: state.code, name: state.name, href: toolPath(tool) }] : [];
    }),
  })).filter((mode) => mode.links.length > 0);
}

export function HomePage() {
  const total = publishedTools.length.toLocaleString("en-US");
  const quick = QUICK_LINKS.flatMap(({ slug, label }) => {
    const tool = getTool(slug);
    return tool ? [{ label, href: toolPath(tool) }] : [];
  });
  const popular = resolve(POPULAR_SLUGS);

  return (
    <>
      <section className="lt-hero">
        <div className="lt-wrap lt-hero__grid">
          <div>
            <h1>Free tools that never see your files.</h1>
            <p className="lt-hero__lede">
              {total} calculators, converters and document builders. Each one runs inside this browser tab, so nothing you type or drop in is uploaded.
            </p>
            <SearchTrigger className="lt-hero__search" count={publishedTools.length} label="Search by task, like “paycheck” or “merge pdf”">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </SearchTrigger>
            <div className="lt-hero__try">
              <span>Popular:</span>
              {quick.map(({ label, href }) => (
                <Link key={href} href={href}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <PaycheckDemo />
        </div>
      </section>

      <section className="lt-section lt-section--rule" aria-labelledby="home-categories">
        <div className="lt-wrap">
          <div className="lt-head">
            <h2 id="home-categories">Sorted by the job you need done.</h2>
            <p>Fifteen shelves. Open one to see every tool in it, or pick a favorite straight from the list.</p>
          </div>
          <div className="lt-index">
            {categoryKeys.map((key) => (
              <div className="lt-index__row" key={key}>
                <span className="lt-glyph">
                  <CategoryIcon category={key} size={18} />
                </span>
                <div>
                  <h3>
                    <Link href={`/tools/${key}/`}>{categoryShortNames[key]}</Link>
                  </h3>
                  <p>{categoryBlurbs[key]}</p>
                  <div className="lt-index__tools">
                    {popularIn(key, 3).map((tool) => (
                      <Link key={tool.id} href={toolPath(tool)}>
                        {tool.name || tool.title}
                      </Link>
                    ))}
                  </div>
                </div>
                <span className="lt-index__count lt-num">{toolsIn(key).length}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lt-section lt-section--ink" aria-labelledby="home-states">
        <div className="lt-wrap">
          <div className="lt-head">
            <h2 id="home-states">Your state, your numbers.</h2>
            <p>Tax rates, insurance minimums and contract rules change at the state line. Pick yours and get a tool set up for it.</p>
          </div>
          <StatePicker modes={stateModes()} />
        </div>
      </section>

      <section className="lt-section" aria-labelledby="home-privacy">
        <div className="lt-wrap lt-privacy">
          <div>
            <div className="lt-head" style={{ marginBottom: 0 }}>
              <h2 id="home-privacy">The work happens on your side of the screen.</h2>
            </div>
            <div className="lt-facts">
              <div>
                <h3>No uploads</h3>
                <p>PDFs, photos and spreadsheets are opened by your browser. They are not sent to a server to be processed.</p>
              </div>
              <div>
                <h3>No account</h3>
                <p>There is nothing to sign up for, and no history of what you calculated is kept.</p>
              </div>
              <div>
                <h3>Shows its working</h3>
                <p>Every calculator lists the formula and rates it uses, so you can check the answer yourself.</p>
              </div>
            </div>
          </div>
          <PrivacyDiagram />
        </div>
      </section>

      <section className="lt-section lt-section--rule" aria-labelledby="home-popular">
        <div className="lt-wrap">
          <div className="lt-head">
            <h2 id="home-popular">Where most people start.</h2>
            <Link className="lt-btn lt-btn--quiet" href="/tools/">
              Browse all {total} tools
            </Link>
          </div>
          <div className="lt-popular">
            {popular.map((tool) => (
              <Link key={tool.id} href={toolPath(tool)}>
                <span className="lt-glyph">
                  <CategoryIcon category={tool.category} size={18} />
                </span>
                <span>
                  <h3>{tool.title}</h3>
                  <p>{tool.shortDesc}</p>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
