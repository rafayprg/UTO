"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CategoryIcon } from "@/components/ToolIcon";
import { categoryShortNames } from "@/lib/published";
import type { ToolCategory } from "@/lib/tools-registry";

export interface GuideSummary {
  title: string;
  desc: string;
  category: ToolCategory;
  group: string;
  guideHref: string;
  toolHref: string;
}

interface Props {
  guides: GuideSummary[];
}

const ALL = "All";

export function GuideBrowser({ guides }: Props) {
  const [query, setQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>(ALL);

  const categories = useMemo(() => {
    const cats = new Set<ToolCategory>();
    for (const g of guides) cats.add(g.category);
    return Array.from(cats);
  }, [guides]);

  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);

  const filtered = useMemo(() => {
    return guides.filter((g) => {
      if (selectedCat !== ALL && g.category !== selectedCat) return false;
      if (terms.length === 0) return true;
      const text = `${g.title} ${g.desc} ${g.group}`.toLowerCase();
      return terms.every((term) => text.includes(term));
    });
  }, [guides, selectedCat, terms]);

  // Group by category for structured layout
  const grouped = useMemo(() => {
    const map = new Map<ToolCategory, GuideSummary[]>();
    for (const g of filtered) {
      const arr = map.get(g.category) || [];
      arr.push(g);
      map.set(g.category, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="lt-filter">
        <div className="lt-filter__row">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search guides by formula, statute, or calculation..."
            aria-label="Search guides"
          />
          <span className="lt-filter__count lt-num" aria-live="polite">
            {filtered.length} of {guides.length}
          </span>
        </div>

        {/* Category Filter Chips */}
        <div className="lt-chips" role="group" aria-label="Filter guides by category" style={{ marginTop: 12 }}>
          <button
            type="button"
            aria-pressed={selectedCat === ALL}
            onClick={() => setSelectedCat(ALL)}
          >
            All Categories ({guides.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              aria-pressed={selectedCat === cat}
              onClick={() => setSelectedCat(cat)}
            >
              {categoryShortNames[cat] || cat}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {grouped.length === 0 && (
        <div className="lt-empty p-8 text-center bg-surface border border-rule rounded-xl">
          <p className="text-base text-graphite mb-2">
            No guides match &ldquo;{query}&rdquo;.
          </p>
          <button
            type="button"
            className="lt-btn lt-btn--quiet"
            onClick={() => {
              setQuery("");
              setSelectedCat(ALL);
            }}
          >
            Clear Search Filter
          </button>
        </div>
      )}

      {/* Grouped Guides List */}
      <div className="space-y-10">
        {grouped.map(([cat, items]) => (
          <section key={cat} className="lt-group" aria-label={`${cat} guides`}>
            <div className="flex items-center gap-3 pb-3 border-b border-rule mb-4">
              <span className="lt-glyph">
                <CategoryIcon category={cat} size={20} />
              </span>
              <h2 className="text-lg font-semibold text-ink">
                {categoryShortNames[cat] || cat} Guides{" "}
                <small className="lt-num text-xs px-2 py-0.5 rounded-full bg-paper border border-rule">
                  {items.length}
                </small>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.slice(0, selectedCat === ALL ? 24 : 100).map((guide) => (
                <div
                  key={guide.guideHref}
                  className="p-4 rounded-xl border border-rule bg-surface hover:border-ledger transition-all shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <span className="text-xs font-mono font-medium text-ledger block mb-1">
                      {guide.group}
                    </span>
                    <h3 className="text-sm font-semibold text-ink mb-1 line-clamp-2">
                      <Link href={guide.guideHref} className="hover:text-ledger">
                        {guide.title} Guide
                      </Link>
                    </h3>
                    <p className="text-xs text-graphite line-clamp-2 mb-3">
                      {guide.desc}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-rule text-xs">
                    <Link
                      href={guide.guideHref}
                      className="text-ledger font-medium hover:underline inline-flex items-center gap-1"
                    >
                      Read Guide →
                    </Link>
                    <Link
                      href={guide.toolHref}
                      className="text-graphite hover:text-ink text-[11px]"
                    >
                      Open Tool
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {selectedCat === ALL && items.length > 24 && (
              <div className="text-center pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedCat(cat)}
                  className="text-xs font-semibold text-ledger hover:underline inline-flex items-center gap-1"
                >
                  View all {items.length} {categoryShortNames[cat]} guides →
                </button>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
