"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search, X, LayoutGrid } from "lucide-react";
import { tools, categories, toolPath, type ToolCategory, type ToolDefinition } from "@/lib/tools-registry";
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
  return <Link className={`tool-card ${tool.status === "planned" ? "is-planned" : ""}`} href={toolPath(tool)}>
    <div className="card-top"><span className={`tool-icon ${tool.category}`}><ToolIcon tool={tool}/></span><ArrowUpRight size={18} className="card-arrow"/></div>
    <h3>{tool.title}</h3><p>{tool.shortDesc}</p>
    <div className="card-bottom"><span>{engineLabel(tool)}</span>{tool.status === "planned" ? <span className="soon-tag">Coming soon</span> : <span className="live-tag">Free</span>}</div>
  </Link>;
}

function matches(tool: ToolDefinition, query: string): boolean {
  if (!query) return true;
  return `${tool.title} ${tool.shortDesc} ${tool.group} ${tool.keywords.join(" ")}`.toLowerCase().includes(query);
}

export function ToolDirectory({ category }: { category?: ToolCategory }) {
  const [selected, setSelected] = useState<ToolCategory | "all">(category || "all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const needle = query.toLowerCase().trim();
  const filtered = useMemo(() => tools
    .filter(tool => (selected === "all" || tool.category === selected) && (status === "all" || tool.status === status) && matches(tool, needle))
    .sort((a, b) => Number(b.status === "live") - Number(a.status === "live")), [selected, status, needle]);
  const liveCount = tools.filter(tool => tool.status === "live" && (selected === "all" || tool.category === selected)).length;
  const groups = useMemo(() => {
    const map = new Map<string, ToolDefinition[]>();
    for (const tool of filtered) map.set(tool.group, [...(map.get(tool.group) ?? []), tool]);
    return [...map.entries()];
  }, [filtered]);
  const grouped = Boolean(category) && !needle;
  const reset = () => setVisible(PAGE_SIZE);

  return <section id="directory" className="directory">
    <div className="section-heading"><div><p className="eyebrow">ONE HUB. EVERYDAY POSSIBILITIES.</p><h2>{category ? "Tools in this suite" : "Find your next favorite tool"}</h2></div><span className="count-badge">{liveCount} live · {filtered.length} shown</span></div>
    <div className="directory-controls">
      <label className="search directory-search"><Search size={18}/><span className="sr-only">Search tools</span><input placeholder="Search tools, formats, or tasks…" value={query} onChange={e => { setQuery(e.target.value); reset(); }}/>{query && <button type="button" aria-label="Clear search" onClick={() => setQuery("")}><X size={16}/></button>}</label>
      <div className="segment-control status-filter" aria-label="Filter by availability">{([["all", "All"], ["live", "Live now"], ["planned", "Coming soon"]] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={status === value} onClick={() => { setStatus(value); reset(); }}>{label}</button>)}</div>
    </div>
    {!category && <div className="filters" aria-label="Filter tools by category"><button type="button" aria-pressed={selected === "all"} className={`filter ${selected === "all" ? "active" : ""}`} onClick={() => { setSelected("all"); reset(); }}><LayoutGrid size={15}/> All apps</button>{(Object.keys(categories) as ToolCategory[]).map(key => <button type="button" key={key} aria-pressed={selected === key} className={`filter ${selected === key ? "active" : ""}`} onClick={() => { setSelected(key); reset(); }}><CategoryIcon category={key} size={15}/>{categories[key]}</button>)}</div>}
    <div className="results-heading"><p role="status">{filtered.length} {filtered.length === 1 ? "tool" : "tools"}{selected !== "all" ? ` · ${categories[selected]}` : " · All categories"}</p>{selected !== "all" && !category && <Link className="text-link" href={`/tools/${selected}/`}>Explore suite <ArrowUpRight size={14}/></Link>}</div>
    {grouped
      ? groups.map(([group, items]) => <div key={group} className="tool-group"><h3 className="group-heading">{group} <small>{items.filter(tool => tool.status === "live").length} live of {items.length}</small></h3><div className="tool-grid">{items.map(tool => <ToolCard tool={tool} key={tool.id}/>)}</div></div>)
      : <div className="tool-grid">{filtered.slice(0, visible).map(tool => <ToolCard tool={tool} key={tool.id}/>)}</div>}
    {!grouped && filtered.length > visible && <div className="show-more"><button type="button" className="button secondary" onClick={() => setVisible(count => count + PAGE_SIZE)}>Show {Math.min(PAGE_SIZE, filtered.length - visible)} more</button></div>}
    {filtered.length === 0 && <div className="empty"><LayoutGrid size={32}/><h3>{query ? `No matches for “${query}”` : "Nothing here yet"}</h3><p>{query ? "Try a task such as PDF, Base64, JSON, or mortgage." : "Try another filter."}</p><button className="button secondary" onClick={() => { setQuery(""); setSelected(category || "all"); setStatus("all"); }}>Show all</button></div>}
  </section>;
}
