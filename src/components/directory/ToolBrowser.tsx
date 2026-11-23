"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ToolSummary } from "@/lib/published";

type Props = { items: ToolSummary[]; label: string };
const ALL = "All";

/** Filterable list of tools. Every link is in the server HTML; filtering only hides rows. */
export function ToolBrowser({ items, label }: Props) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState(ALL);

  const groups = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) counts.set(item.group, (counts.get(item.group) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
  }, [items]);

  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const visible = items.filter((item) => {
    if (group !== ALL && item.group !== group) return false;
    const text = `${item.title} ${item.desc}`.toLowerCase();
    return terms.every((term) => text.includes(term));
  });

  const sections = groups
    .map((name) => ({ name, rows: visible.filter((item) => item.group === name) }))
    .filter((section) => section.rows.length > 0);

  return (
    <>
      <div className="lt-filter">
        <div className="lt-filter__row">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Filter ${items.length} ${label} tools`}
            aria-label={`Filter ${label} tools`}
          />
          <span className="lt-filter__count lt-num" aria-live="polite">
            {visible.length} of {items.length}
          </span>
        </div>
        {groups.length > 1 && (
          <div className="lt-chips" role="group" aria-label="Filter by type" style={{ marginTop: 10 }}>
            {[ALL, ...groups].map((name) => (
              <button key={name} type="button" aria-pressed={group === name} onClick={() => setGroup(name)}>
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {sections.length === 0 && (
        <p className="lt-empty">
          Nothing here matches “{query}”.{" "}
          <button
            type="button"
            className="lt-link"
            style={{ border: 0, background: "none", padding: 0 }}
            onClick={() => {
              setQuery("");
              setGroup(ALL);
            }}
          >
            Clear the filter
          </button>
        </p>
      )}

      {sections.map((section) => (
        <section className="lt-group" key={section.name} aria-label={section.name}>
          <h2>
            {section.name} <small className="lt-num">{section.rows.length}</small>
          </h2>
          <div className="lt-list">
            {section.rows.map((item) => (
              <Link key={item.href} href={item.href}>
                <strong>{item.title}</strong>
                <span>{item.desc}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
