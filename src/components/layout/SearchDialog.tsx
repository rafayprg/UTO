"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { categoryShortNames } from "@/lib/category-names";
import type { ToolCategory } from "@/lib/categories";

const OPEN_EVENT = "lt:open-search";
const MAX_RESULTS = 30;
const SUGGESTIONS = ["paycheck", "merge pdf", "mortgage", "json", "remove background", "nda"];

type Entry = { title: string; href: string; category: ToolCategory; haystack: string };
type LoadState = "idle" | "loading" | "ready" | "error";

let indexPromise: Promise<Entry[]> | null = null;

function loadIndex(): Promise<Entry[]> {
  indexPromise ??= fetch("/search-index.json")
    .then((response) => {
      if (!response.ok) throw new Error(`Search index returned ${response.status}`);
      return response.json() as Promise<Array<[string, string, ToolCategory, string]>>;
    })
    .then((rows) =>
      rows.map(([title, href, category, keywords]) => ({
        title,
        href,
        category,
        haystack: `${title} ${keywords} ${categoryShortNames[category] ?? ""}`.toLowerCase(),
      })),
    )
    .catch((error: unknown) => {
      indexPromise = null; // allow a retry on next open
      throw error;
    });
  return indexPromise;
}

function rank(entries: Entry[], query: string): Entry[] {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];
  const scored: Array<{ entry: Entry; score: number }> = [];
  for (const entry of entries) {
    if (!terms.every((term) => entry.haystack.includes(term))) continue;
    const title = entry.title.toLowerCase();
    const score =
      (title.startsWith(terms[0]) ? 4 : 0) +
      terms.filter((term) => title.includes(term)).length * 2 -
      title.length / 200;
    scored.push({ entry, score });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, MAX_RESULTS).map(({ entry }) => entry);
}

export function openSearch(prefill = "") {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: prefill }));
}

type TriggerProps = { className: string; count: number; children?: ReactNode; label?: string };

export function SearchTrigger({ className, count, children, label }: TriggerProps) {
  return (
    <button type="button" className={className} onClick={() => openSearch()} aria-label={`Search ${count.toLocaleString("en-US")} tools`}>
      {children}
      <span>{label ?? `Search ${count.toLocaleString("en-US")} tools`}</span>
      <kbd>Ctrl K</kbd>
    </button>
  );
}

export function SearchDialog() {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [state, setState] = useState<LoadState>("idle");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const open = useCallback((prefill: string) => {
    setQuery(prefill);
    setActive(0);
    if (!dialog.current?.open) dialog.current?.showModal();
    input.current?.focus();
    setState((current) => (current === "ready" ? current : "loading"));
    loadIndex()
      .then((rows) => {
        setEntries(rows);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, []);

  useEffect(() => {
    const onOpen = (event: Event) => open((event as CustomEvent<string>).detail ?? "");
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        open("");
      }
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_EVENT, onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const results = useMemo(() => rank(entries, query), [entries, query]);
  const close = () => dialog.current?.close();

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((index) => Math.max(0, Math.min(results.length - 1, index + step)));
    }
    if (event.key === "Enter" && results[active]) {
      event.preventDefault();
      dialog.current?.querySelector<HTMLAnchorElement>(`[data-index="${active}"]`)?.click();
    }
  };

  return (
    <dialog
      ref={dialog}
      className="lt-search"
      aria-label="Search tools"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="lt-search__field">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          ref={input}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="What do you need to do?"
          aria-label="Search tools"
          aria-controls="lt-search-results"
          autoComplete="off"
          spellCheck={false}
        />
        <button type="button" onClick={close} aria-label="Close search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <div className="lt-search__results" id="lt-search-results" role="listbox" aria-label="Matching tools">
        {state === "error" && <p className="lt-search__empty">Search could not load. Check your connection and open search again.</p>}
        {state !== "error" && query.trim() === "" && (
          <div className="lt-search__empty">
            <p>Type a task, like a tool name or a state. Some ideas:</p>
            <div className="lt-hero__try" style={{ marginTop: 12 }}>
              {SUGGESTIONS.map((term) => (
                <button key={term} type="button" className="lt-btn lt-btn--quiet" style={{ minHeight: 34 }} onClick={() => setQuery(term)}>
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
        {state === "loading" && query.trim() !== "" && <p className="lt-search__empty">Loading tools…</p>}
        {state === "ready" && query.trim() !== "" && results.length === 0 && (
          <p className="lt-search__empty">No tool matches “{query}”. Try a shorter word, like “tax” or “pdf”.</p>
        )}
        {results.map((entry, index) => (
          <Link
            key={entry.href}
            href={entry.href}
            data-index={index}
            data-active={index === active}
            role="option"
            aria-selected={index === active}
            onMouseEnter={() => setActive(index)}
            onClick={close}
          >
            <span>
              {entry.title}
              <small>{categoryShortNames[entry.category]}</small>
            </span>
            <svg className="lt-search__go" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        ))}
      </div>
      <p className="lt-search__foot">
        <span>↑ ↓ to move</span>
        <span>Enter to open</span>
        <span>Esc to close</span>
      </p>
    </dialog>
  );
}
