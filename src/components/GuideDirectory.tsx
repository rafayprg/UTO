"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  X,
  LayoutGrid,
  ArrowRight,
  ArrowUpRight,
  Clock,
  Calculator,
  FileCheck2,
  Sparkles,
} from "lucide-react";
import {
  tools,
  categories,
  toolPath,
  type ToolCategory,
  type ToolDefinition,
} from "@/lib/tools-registry";
import { CategoryIcon } from "./ToolIcon";

const GUIDES_PAGE_SIZE = 36;

export function GuideCard({ tool }: { tool: ToolDefinition }) {
  const guideUrl = `${toolPath(tool)}guide/`;
  const toolUrl = toolPath(tool);
  const categoryName = categories[tool.category] || tool.category;

  return (
    <article className="guide-directory-card">
      <div className="guide-card-top">
        <span className="guide-card-category">
          <CategoryIcon category={tool.category} size={14} />
          {categoryName}
        </span>
        <span className="guide-card-time">
          <Clock size={12} /> 5 min read
        </span>
      </div>

      <h3 className="guide-card-title">
        <Link href={guideUrl}>Complete Guide to {tool.title}</Link>
      </h3>

      <p className="guide-card-desc">
        {tool.shortDesc} Step-by-step walkthrough, mathematical formulas, and real-world worked scenarios.
      </p>

      <div className="guide-card-features">
        {tool.formulaExplanation && (
          <span className="guide-pill">
            <Calculator size={11} /> Formula Included
          </span>
        )}
        {tool.workedExamples && tool.workedExamples.length > 0 && (
          <span className="guide-pill">
            <FileCheck2 size={11} /> Worked Examples
          </span>
        )}
        <span className="guide-pill free-pill">100% Free</span>
      </div>

      <div className="guide-card-footer">
        <Link href={guideUrl} className="read-guide-link">
          Read Guide <ArrowRight size={14} />
        </Link>
        <Link href={toolUrl} className="open-tool-link" title={`Launch ${tool.title}`}>
          Open Tool <ArrowUpRight size={13} />
        </Link>
      </div>
    </article>
  );
}

export function GuideDirectory({ defaultCategory }: { defaultCategory?: ToolCategory }) {
  const [selected, setSelected] = useState<ToolCategory | "all">(defaultCategory || "all");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(GUIDES_PAGE_SIZE);

  const needle = query.toLowerCase().trim();

  const filtered = useMemo(() => {
    return tools.filter((tool) => {
      const matchCat = selected === "all" || tool.category === selected;
      const matchQuery =
        !needle ||
        tool.title.toLowerCase().includes(needle) ||
        tool.shortDesc.toLowerCase().includes(needle) ||
        tool.group.toLowerCase().includes(needle) ||
        tool.keywords.some((k) => k.toLowerCase().includes(needle));
      return matchCat && matchQuery;
    });
  }, [selected, needle]);

  const reset = () => setVisible(GUIDES_PAGE_SIZE);

  const groupedByCategory = useMemo(() => {
    if (selected !== "all" || needle) return null;
    const map = new Map<ToolCategory, ToolDefinition[]>();
    for (const tool of tools) {
      const list = map.get(tool.category) || [];
      list.push(tool);
      map.set(tool.category, list);
    }
    return [...map.entries()];
  }, [selected, needle]);

  return (
    <section className="guide-directory-wrapper">
      <div className="directory-controls">
        <label className="search directory-search">
          <Search size={18} />
          <span className="sr-only">Search guides</span>
          <input
            placeholder="Search guides by tool name, topic, or formula…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              reset();
            }}
          />
          {query && (
            <button type="button" aria-label="Clear search" onClick={() => setQuery("")}>
              <X size={16} />
            </button>
          )}
        </label>
      </div>

      {/* Category Pills */}
      <div className="filters guide-filters" aria-label="Filter guides by category">
        <button
          type="button"
          aria-pressed={selected === "all"}
          className={`filter ${selected === "all" ? "active" : ""}`}
          onClick={() => {
            setSelected("all");
            reset();
          }}
        >
          <LayoutGrid size={15} /> All Guides ({tools.length})
        </button>
        {(Object.keys(categories) as ToolCategory[]).map((key) => {
          const count = tools.filter((t) => t.category === key).length;
          return (
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
              {categories[key]} ({count})
            </button>
          );
        })}
      </div>

      <div className="results-heading">
        <p role="status">
          Showing <strong>{filtered.length}</strong> {filtered.length === 1 ? "guide" : "guides"}
          {selected !== "all" ? ` in ${categories[selected]}` : " across all categories"}
        </p>
      </div>

      {/* If viewing All without search: Show Grouped by Category */}
      {groupedByCategory ? (
        <div className="grouped-guides-container">
          {groupedByCategory.map(([catKey, catTools]) => (
            <div key={catKey} className="guide-category-block">
              <div className="category-block-header">
                <div>
                  <span className="eyebrow">
                    <Sparkles size={12} /> {categories[catKey]?.toUpperCase()} SUITE
                  </span>
                  <h2>{categories[catKey]} Guides</h2>
                </div>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => {
                    setSelected(catKey);
                    reset();
                  }}
                >
                  View all {catTools.length} {categories[catKey]} guides &rarr;
                </button>
              </div>

              <div className="tool-grid guide-grid">
                {catTools.slice(0, 6).map((tool) => (
                  <GuideCard key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* If filtered by Category or Search: Show Grid with Pagination */
        <>
          <div className="tool-grid guide-grid">
            {filtered.slice(0, visible).map((tool) => (
              <GuideCard key={tool.id} tool={tool} />
            ))}
          </div>

          {filtered.length > visible && (
            <div className="show-more">
              <button
                type="button"
                className="button secondary"
                onClick={() => setVisible((prev) => prev + GUIDES_PAGE_SIZE)}
              >
                Load {Math.min(GUIDES_PAGE_SIZE, filtered.length - visible)} More Guides
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
