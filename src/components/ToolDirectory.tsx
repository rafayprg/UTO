"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Search,
  X,
  LayoutGrid,
  Sparkles,
  Zap,
  FileText,
  DollarSign,
  Code,
  Image as ImageIcon,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Compass,
} from "lucide-react";
import {
  tools,
  categories,
  toolPath,
  type ToolCategory,
  type ToolDefinition,
} from "@/lib/tools-registry";
import { ToolIcon, CategoryIcon } from "./ToolIcon";

const PAGE_SIZE = 48;
type StatusFilter = "all" | "live" | "planned";

function engineLabel(tool: ToolDefinition): string {
  if (tool.status === "planned") return "Frontend preview";
  if (tool.engineType === "wasm") return "Browser AI / WASM";
  if (tool.engineType === "worker") return "Local file processing";
  return "Instant browser tool";
}

export function ToolCard({ tool }: { tool: ToolDefinition }) {
  return (
    <Link
      className={`tool-card ${tool.status === "planned" ? "is-planned" : ""}`}
      href={toolPath(tool)}
    >
      <div className="card-top">
        <span className={`tool-icon ${tool.category}`}>
          <ToolIcon tool={tool} />
        </span>
        <ArrowUpRight size={18} className="card-arrow" />
      </div>
      <h3>{tool.title}</h3>
      <p>{tool.shortDesc}</p>
      <div className="card-bottom">
        <span>{engineLabel(tool)}</span>
        {tool.status === "planned" ? (
          <span className="soon-tag">Coming soon</span>
        ) : (
          <span className="live-tag">100% Free</span>
        )}
      </div>
    </Link>
  );
}

function matches(tool: ToolDefinition, query: string): boolean {
  if (!query) return true;
  return `${tool.title} ${tool.shortDesc} ${tool.group} ${tool.keywords.join(" ")}`
    .toLowerCase()
    .includes(query);
}

// Intent Categories for Smart Suggestions
type IntentKey =
  | "essentials"
  | "documents"
  | "finance"
  | "dev"
  | "media"
  | "security"
  | "business";

interface IntentConfig {
  key: IntentKey;
  label: string;
  icon: typeof Zap;
  description: string;
  toolSlugs: string[];
  fallbackCategories: ToolCategory[];
}

const INTENT_PRESETS: IntentConfig[] = [
  {
    key: "essentials",
    label: "Daily Essentials",
    icon: Zap,
    description: "Most popular everyday private tools used by thousands daily.",
    toolSlugs: [
      "pdf-merger",
      "mortgage-calculator",
      "background-remover",
      "stripe-fee-calculator",
      "us-1099-tax-calculator",
      "heic-converter",
      "zip-tool",
      "invoice-pdf-generator",
    ],
    fallbackCategories: ["pdf", "finance", "image"],
  },
  {
    key: "documents",
    label: "PDF & Documents",
    icon: FileText,
    description: "Merge, convert, sign, and redact documents with zero server uploads.",
    toolSlugs: [
      "pdf-merger",
      "local-pdf-redactor",
      "invoice-pdf-generator",
      "heic-converter",
      "zip-tool",
      "privacy-policy-generator",
    ],
    fallbackCategories: ["pdf", "legal"],
  },
  {
    key: "finance",
    label: "Finance & Wealth",
    icon: DollarSign,
    description: "Precise mortgage, tax, retirement, and cash flow estimators.",
    toolSlugs: [
      "mortgage-calculator",
      "us-1099-tax-calculator",
      "401k-retirement-calculator",
      "rent-vs-buy",
      "life-insurance-calculator",
      "debt-payoff-calculator",
      "auto-refinance-calculator",
      "rental-roi-calculator",
    ],
    fallbackCategories: ["finance", "real-estate", "insurance"],
  },
  {
    key: "dev",
    label: "Dev & Engineering",
    icon: Code,
    description: "Instant data transforms, decoders, regex testers, and hashing utilities.",
    toolSlugs: [
      "wcag-contrast-checker",
      "zip-tool",
      "saas-metrics-calculator",
      "roas-cpa-calculator",
    ],
    fallbackCategories: ["dev", "crypto", "data"],
  },
  {
    key: "media",
    label: "Media & Images",
    icon: ImageIcon,
    description: "Compress, convert, trim, and enhance visuals directly in your browser.",
    toolSlugs: [
      "background-remover",
      "heic-converter",
      "video-trimmer",
      "wcag-contrast-checker",
    ],
    fallbackCategories: ["image", "media", "youtube"],
  },
  {
    key: "security",
    label: "Security & Legal",
    icon: ShieldCheck,
    description: "Air-gapped contracts, NDA generators, and privacy compliance tools.",
    toolSlugs: [
      "privacy-policy-generator",
      "freelance-nda-generator",
      "local-pdf-redactor",
      "wcag-contrast-checker",
    ],
    fallbackCategories: ["legal", "crypto"],
  },
  {
    key: "business",
    label: "Business & Growth",
    icon: TrendingUp,
    description: "E-commerce fees, SaaS churn/LTV, ROAS, and AdSense RPM calculators.",
    toolSlugs: [
      "stripe-fee-calculator",
      "amazon-fba-calculator",
      "saas-metrics-calculator",
      "roas-cpa-calculator",
      "adsense-rpm-calculator",
      "invoice-pdf-generator",
    ],
    fallbackCategories: ["business", "marketing"],
  },
];

const POPULAR_SEARCH_CHIPS = [
  "PDF Merger",
  "Mortgage Calculator",
  "Background Remover",
  "1099 Tax",
  "Stripe Fee",
  "HEIC to JPG",
  "401(k) Planner",
  "Invoice Generator",
];

export function ToolDirectory({ category }: { category?: ToolCategory }) {
  const [viewMode, setViewMode] = useState<"suggest" | "full">(category ? "full" : "suggest");
  const [activeIntent, setActiveIntent] = useState<IntentKey>("essentials");
  const [selected, setSelected] = useState<ToolCategory | "all">(category || "all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const needle = query.toLowerCase().trim();

  // All filtered tools matching the query, category, and status
  const filtered = useMemo(
    () =>
      tools
        .filter(
          (tool) =>
            (selected === "all" || tool.category === selected) &&
            (status === "all" || tool.status === status) &&
            matches(tool, needle)
        )
        .sort((a, b) => Number(b.status === "live") - Number(a.status === "live")),
    [selected, status, needle]
  );

  const liveCount = tools.filter(
    (tool) => tool.status === "live" && (selected === "all" || tool.category === selected)
  ).length;

  const groups = useMemo(() => {
    const map = new Map<string, ToolDefinition[]>();
    for (const tool of filtered) map.set(tool.group, [...(map.get(tool.group) ?? []), tool]);
    return [...map.entries()];
  }, [filtered]);

  const grouped = Boolean(category) && !needle;
  const reset = () => setVisible(PAGE_SIZE);

  // Suggested Tools for the currently active intent
  const currentIntentConfig = useMemo(
    () => INTENT_PRESETS.find((i) => i.key === activeIntent) || INTENT_PRESETS[0],
    [activeIntent]
  );

  const suggestedTools = useMemo(() => {
    const specificTools = currentIntentConfig.toolSlugs
      .map((slug) => tools.find((t) => t.slug === slug))
      .filter((t): t is ToolDefinition => Boolean(t));

    if (specificTools.length >= 6) return specificTools.slice(0, 8);

    // Fallback to top tools from intent categories
    const extraTools = tools.filter(
      (t) =>
        currentIntentConfig.fallbackCategories.includes(t.category) &&
        !specificTools.some((st) => st.id === t.id)
    );

    return [...specificTools, ...extraTools].slice(0, 8);
  }, [currentIntentConfig]);

  // Direct relevant results when searching in Suggest mode
  const searchSuggestions = useMemo(() => {
    if (!needle) return [];
    return tools.filter((tool) => matches(tool, needle)).slice(0, 8);
  }, [needle]);

  // Related suggestions when a search is active
  const relatedSearchSuggestions = useMemo(() => {
    if (!needle || searchSuggestions.length === 0) return [];
    const matchedCategories = new Set(searchSuggestions.map((t) => t.category));
    return tools
      .filter(
        (t) =>
          matchedCategories.has(t.category) &&
          !searchSuggestions.some((s) => s.id === t.id)
      )
      .slice(0, 4);
  }, [needle, searchSuggestions]);

  return (
    <section id="directory" className="directory smart-directory">
      {/* 1. SECTION INTRO / HEADER */}
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            <Sparkles size={13} />
            {category
              ? `SUITE DIRECTORY · ${categories[category].toUpperCase()}`
              : viewMode === "suggest"
              ? "INTENT DISCOVERY · ZERO CATALOG OVERWHELM"
              : "COMPLETE INVENTORY · 1,034 LOCAL TOOLS"}
          </p>
          <h2>
            {category
              ? `Tools in this suite`
              : viewMode === "suggest"
              ? "Find exactly what you need"
              : "Complete Tool Directory"}
          </h2>
          <p className="directory-subtext">
            {viewMode === "suggest" && !category
              ? "Select your objective or search directly. Curated, relevant tools are shown instantly without dumping all 1,034 items."
              : `Browsing ${filtered.length} client-side tools across specialized suites. Zero server uploads, 100% private.`}
          </p>
        </div>

        {!category && (
          <div className="view-mode-toggle">
            <button
              type="button"
              className={`mode-btn ${viewMode === "suggest" ? "active" : ""}`}
              onClick={() => {
                setViewMode("suggest");
                setSelected("all");
              }}
            >
              <Sparkles size={14} /> Smart Suggestions
            </button>
            <button
              type="button"
              className={`mode-btn ${viewMode === "full" ? "active" : ""}`}
              onClick={() => {
                setViewMode("full");
                reset();
              }}
            >
              <LayoutGrid size={14} /> Full Catalog ({tools.length})
            </button>
          </div>
        )}
      </div>

      {/* 2. UNIVERSAL SMART SEARCH WITH INSTANT CHIPS */}
      <div className="smart-search-container">
        <label className="search directory-search">
          <Search size={18} />
          <span className="sr-only">Search tools</span>
          <input
            placeholder="Search by task (e.g. merge pdf, calculate loan, remove background, format json)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              reset();
            }}
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
            >
              <X size={16} />
            </button>
          )}
        </label>

        {/* Quick Suggestion Search Chips */}
        {!query && (
          <div className="quick-search-chips">
            <span className="chips-label">Popular tasks:</span>
            {POPULAR_SEARCH_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                className="chip-btn"
                onClick={() => setQuery(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================
          BRANCH A: SMART SUGGESTIONS MODE (DEFAULT - NO DUMP)
          ======================================================== */}
      {viewMode === "suggest" && !category && (
        <div className="smart-suggest-wrapper">
          {/* If User has typed a search query, show Precision Matches */}
          {needle ? (
            <div className="search-relevance-view">
              <div className="results-heading">
                <p role="status">
                  <strong>{searchSuggestions.length} precision matches</strong> for “{query}”
                </p>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => {
                    setViewMode("full");
                  }}
                >
                  View all in full catalog <ArrowUpRight size={14} />
                </button>
              </div>

              {searchSuggestions.length > 0 ? (
                <>
                  <div className="tool-grid">
                    {searchSuggestions.map((tool) => (
                      <ToolCard tool={tool} key={tool.id} />
                    ))}
                  </div>

                  {/* Complementary Suggestions */}
                  {relatedSearchSuggestions.length > 0 && (
                    <div className="related-suggestions-card">
                      <div className="related-header">
                        <Compass size={18} />
                        <div>
                          <h4>Related & Recommended Tools</h4>
                          <p>Users who searched for “{query}” also frequently use these tools:</p>
                        </div>
                      </div>
                      <div className="related-grid">
                        {relatedSearchSuggestions.map((tool) => (
                          <Link
                            key={tool.id}
                            href={toolPath(tool)}
                            className="related-item-link"
                          >
                            <span className={`tool-icon ${tool.category}`}>
                              <ToolIcon tool={tool} />
                            </span>
                            <div>
                              <span className="related-item-title">{tool.title}</span>
                              <span className="related-item-sub">{tool.group}</span>
                            </div>
                            <ArrowRight size={14} />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty">
                  <LayoutGrid size={32} />
                  <h3>No direct matches for “{query}”</h3>
                  <p>Try searching for tasks like PDF, Calculator, Tax, Base64, or Image.</p>
                  <button
                    className="button secondary"
                    onClick={() => {
                      setQuery("");
                      setViewMode("full");
                    }}
                  >
                    Explore all 1,034 tools in catalog
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* If No Query: Show Intent Selector & Curated High-Utility Tools */
            <div className="intent-explorer">
              <div className="intent-pills-bar" role="tablist" aria-label="Select your task objective">
                {INTENT_PRESETS.map((intent) => {
                  const Icon = intent.icon;
                  const isActive = activeIntent === intent.key;
                  return (
                    <button
                      key={intent.key}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`intent-pill ${isActive ? "active" : ""}`}
                      onClick={() => setActiveIntent(intent.key)}
                    >
                      <Icon size={16} />
                      <span>{intent.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="intent-header-box">
                <div className="intent-info">
                  <h3>{currentIntentConfig.label}</h3>
                  <p>{currentIntentConfig.description}</p>
                </div>
                <span className="relevance-tag">
                  <CheckCircle2 size={13} /> Showing Top Recommended ({suggestedTools.length})
                </span>
              </div>

              {/* Only 6-8 Precision Tools Shown */}
              <div className="tool-grid">
                {suggestedTools.map((tool) => (
                  <ToolCard tool={tool} key={tool.id} />
                ))}
              </div>

              {/* Call-to-Action to browse full 1,034 catalog if desired */}
              <div className="full-catalog-cta-card">
                <div className="cta-content">
                  <span className="cta-badge">LOOKING FOR SOMETHING HIGHLY SPECIALIZED?</span>
                  <h3>Explore the Full 1,034+ Tool Catalog</h3>
                  <p>
                    From niche astronomical algorithms and crypto hashes to B2B SaaS unit economics,
                    every single tool runs 100% locally on your browser.
                  </p>
                </div>
                <button
                  type="button"
                  className="button large cta-btn"
                  onClick={() => {
                    setViewMode("full");
                    reset();
                  }}
                >
                  Open Full Directory ({tools.length} Apps) <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          BRANCH B: FULL CATALOG MODE (EXPLICIT OPT-IN OR SUITE SCOPE)
          ======================================================== */}
      {(viewMode === "full" || category) && (
        <div className="full-directory-wrapper">
          {!category && (
            <div className="directory-back-bar">
              <button
                type="button"
                className="back-to-suggest-btn"
                onClick={() => setViewMode("suggest")}
              >
                ← Back to Curated Smart Suggestions
              </button>
              <span className="count-badge">
                {liveCount} live · {filtered.length} shown
              </span>
            </div>
          )}

          <div className="directory-controls">
            <div
              className="segment-control status-filter"
              aria-label="Filter by availability"
            >
              {(
                [
                  ["all", "All Status"],
                  ["live", "Live Now"],
                  ["planned", "Coming Soon"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={status === value}
                  onClick={() => {
                    setStatus(value);
                    reset();
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {!category && (
            <div className="filters" aria-label="Filter tools by category">
              <button
                type="button"
                aria-pressed={selected === "all"}
                className={`filter ${selected === "all" ? "active" : ""}`}
                onClick={() => {
                  setSelected("all");
                  reset();
                }}
              >
                <LayoutGrid size={15} /> All suites
              </button>
              {(Object.keys(categories) as ToolCategory[]).map((key) => (
                <button
                  type="button"
                  key={key}
                  aria-pressed={selected === key}
                  className={`filter ${selected === key ? "active" : ""}`}
                  onClick={() => {
                    setSelected(key);
                    reset();
                  }}
                >
                  <CategoryIcon category={key} size={15} />
                  {categories[key]}
                </button>
              ))}
            </div>
          )}

          <div className="results-heading">
            <p role="status">
              {filtered.length} {filtered.length === 1 ? "tool" : "tools"}
              {selected !== "all" ? ` · ${categories[selected]}` : " · All suites"}
            </p>
            {selected !== "all" && !category && (
              <Link className="text-link" href={`/tools/${selected}/`}>
                Explore suite <ArrowUpRight size={14} />
              </Link>
            )}
          </div>

          {grouped ? (
            groups.map(([group, items]) => (
              <div key={group} className="tool-group">
                <h3 className="group-heading">
                  {group}{" "}
                  <small>
                    {items.filter((tool) => tool.status === "live").length} live of{" "}
                    {items.length}
                  </small>
                </h3>
                <div className="tool-grid">
                  {items.map((tool) => (
                    <ToolCard tool={tool} key={tool.id} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="tool-grid">
              {filtered.slice(0, visible).map((tool) => (
                <ToolCard tool={tool} key={tool.id} />
              ))}
            </div>
          )}

          {!grouped && filtered.length > visible && (
            <div className="show-more">
              <button
                type="button"
                className="button secondary"
                onClick={() => setVisible((count) => count + PAGE_SIZE)}
              >
                Show {Math.min(PAGE_SIZE, filtered.length - visible)} more
              </button>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="empty">
              <LayoutGrid size={32} />
              <h3>{query ? `No matches for “${query}”` : "Nothing here yet"}</h3>
              <p>
                {query
                  ? "Try a task such as PDF, Base64, JSON, or mortgage."
                  : "Try another filter."}
              </p>
              <button
                className="button secondary"
                onClick={() => {
                  setQuery("");
                  setSelected(category || "all");
                  setStatus("all");
                }}
              >
                Show all
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
