"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Search, X, ArrowUpRight, Shapes, ShieldCheck } from "lucide-react";
import { tools, toolPath, categories } from "@/lib/tools-registry";
import { ToolIcon } from "@/components/ToolIcon";
export function Header() {
  const dialog = useRef<HTMLDialogElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const MAX_RESULTS = 40;
  const results = tools.filter(tool => `${tool.title} ${tool.keywords.join(" ")} ${tool.group} ${categories[tool.category]}`.toLowerCase().includes(query.toLowerCase().trim())).sort((a, b) => Number(b.status === "live") - Number(a.status === "live")).slice(0, MAX_RESULTS);
  function openSearch() { if (!dialog.current?.open) dialog.current?.showModal(); searchInput.current?.focus(); }
  useEffect(() => { const handler = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); if (!dialog.current?.open) dialog.current?.showModal(); searchInput.current?.focus(); } }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, []);
  return <><header className="site-header"><div className="header-inner"><Link href="/" className="brand" aria-label="Localtools home"><span className="brand-symbol"><Shapes size={23}/></span>localtools<span className="brand-period">.</span></Link><nav aria-label="Main navigation"><Link href="/tools/">All Tools</Link><Link href="/blog/">Guides</Link><Link href="/about/">About</Link></nav><button className="command-button" aria-label="Find a tool" onClick={openSearch}><Search size={17}/><span>Search your toolkit</span><kbd>⌘ K / Ctrl K</kbd></button><span className="header-privacy"><ShieldCheck size={16}/> Browser-only</span></div></header>
    <dialog ref={dialog} className="command-dialog" aria-labelledby="command-title" onClick={e => { if (e.target === e.currentTarget) dialog.current?.close(); }}><div className="dialog-top"><label className="search"><Search size={20}/><span className="sr-only">Search all tools</span><input ref={searchInput} autoFocus value={query} onChange={e => { setQuery(e.target.value); setHighlight(0); }} placeholder="What would you like to do?" onKeyDown={e => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); setHighlight(index => Math.max(0, Math.min(results.length - 1, index + (e.key === "ArrowDown" ? 1 : -1)))); }
      if (e.key === "Enter" && results[highlight]) { e.preventDefault(); const link = dialog.current?.querySelector<HTMLAnchorElement>(`[data-result-index="${highlight}"]`); link?.click(); }
    }} aria-controls="command-results" aria-describedby="command-help"/></label><button type="button" aria-label="Close search" onClick={() => dialog.current?.close()}><X size={20}/></button></div><h2 id="command-title" className="eyebrow">FIND YOUR TOOL</h2><div className="search-results" id="command-results">{results.map((tool, index) => <Link data-result-index={index} className={index === highlight ? "highlighted" : ""} key={tool.id} href={toolPath(tool)} onClick={() => dialog.current?.close()}><span className={`tool-icon ${tool.category}`}><ToolIcon tool={tool} size={18}/></span><span>{tool.title}<small>{tool.status === "planned" ? "Coming soon · " : ""}{categories[tool.category]}</small></span><ArrowUpRight size={16}/></Link>)}{results.length === 0 && <p role="status">No matches. Try “PDF”, “JSON”, or “image”.</p>}</div><p id="command-help" className="command-help">↑ ↓ to choose · Enter to open · Esc to close</p></dialog></>;
}
