"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, X, ArrowRight, Sparkles, Command } from "lucide-react";
import { tools, toolPath, categories } from "@/lib/tools-registry";
import { sounds } from "./SoundFX";

const POPULAR_TOOLS = [
  { label: "PDF Merger", href: "/tools/pdf/pdf-merger/", tag: "PDF" },
  { label: "AI BG Remover", href: "/tools/image/background-remover/", tag: "AI" },
  { label: "1099 Tax Calc", href: "/tools/finance/tax-1099-estimator/", tag: "TAX" },
  { label: "JSON Formatter", href: "/tools/dev/json-formatter/", tag: "DEV" },
  { label: "Wi-Fi QR Code", href: "/tools/dev/qr-generator/", tag: "QR" },
  { label: "HEIC to JPG", href: "/tools/image/heic-converter/", tag: "IMG" },
];

export default function HeroSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter tools based on query
  const trimmed = query.trim().toLowerCase();
  const filteredTools = trimmed.length >= 2
    ? tools
        .filter((tool) => {
          const matchTitle = tool.title.toLowerCase().includes(trimmed);
          const matchKeywords = tool.keywords.some((kw) =>
            kw.toLowerCase().includes(trimmed)
          );
          const matchGroup = tool.group.toLowerCase().includes(trimmed);
          const matchCat = categories[tool.category]
            ?.toLowerCase()
            .includes(trimmed);
          return matchTitle || matchKeywords || matchGroup || matchCat;
        })
        .slice(0, 6)
    : [];

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut listener (Ctrl+K, Cmd+K, or '/')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "/" && document.activeElement !== inputRef.current) ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredTools.length ? (prev + 1) % filteredTools.length : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredTools.length
          ? (prev - 1 + filteredTools.length) % filteredTools.length
          : 0
      );
    } else if (e.key === "Enter" && filteredTools[selectedIndex]) {
      e.preventDefault();
      sounds.playClick();
      window.location.href = toolPath(filteredTools[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      {/* Search Bar Input Container */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/30 to-blue-600/30 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-300 pointer-events-none" />

        <div className="relative flex items-center bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-xl backdrop-blur-xl transition-all focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/20">
          <div className="pl-4 pr-2 text-cyan-400 flex items-center pointer-events-none">
            <Search size={20} />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setSelectedIndex(0);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search 1,034+ private tools (e.g. PDF merge, background remover, 1099 tax)..."
            className="w-full bg-transparent py-3.5 pr-20 text-sm text-slate-100 placeholder-slate-400 focus:outline-none font-sans"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="p-1 mr-2 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1 mr-3 px-2 py-1 rounded bg-slate-800/80 border border-slate-700/60 text-[11px] font-mono text-slate-400 select-none">
            <Command size={11} />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Live Dropdown Results */}
      {isOpen && filteredTools.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl shadow-cyan-950/60 backdrop-blur-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <Sparkles size={12} className="text-cyan-400" />
              <span>MATCHING TOOLS ({filteredTools.length})</span>
            </span>
            <span>Use ↑↓ to navigate · Enter to launch</span>
          </div>

          <div className="p-1.5 space-y-1 max-h-[360px] overflow-y-auto">
            {filteredTools.map((tool, idx) => (
              <Link
                key={tool.id}
                href={toolPath(tool)}
                onClick={() => {
                  sounds.playClick();
                  setIsOpen(false);
                }}
                onMouseEnter={() => {
                  setSelectedIndex(idx);
                  sounds.playHover();
                }}
                className={`flex items-center justify-between p-2.5 rounded-xl transition-all ${
                  selectedIndex === idx
                    ? "bg-slate-800/90 text-white border border-cyan-500/40 shadow-sm"
                    : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 uppercase">
                    {tool.category}
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-100 leading-tight">
                      {tool.title}
                    </h4>
                    <p className="text-xs text-slate-400 truncate max-w-md">
                      {tool.shortDesc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Live
                  </span>
                  <ArrowRight
                    size={14}
                    className={
                      selectedIndex === idx
                        ? "text-cyan-400 translate-x-0.5 transition-transform"
                        : "text-slate-500"
                    }
                  />
                </div>
              </Link>
            ))}
          </div>

          <div className="p-2.5 bg-slate-950/80 border-t border-slate-800 text-center">
            <Link
              href="/tools/"
              onClick={() => sounds.playClick()}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1"
            >
              <span>View all 1,034 tools in Directory</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      )}

      {/* Popular Quick Pills */}
      <div className="flex items-center gap-1.5 flex-wrap pt-3 text-xs">
        <span className="text-slate-400 font-mono text-[11px] mr-1">
          Popular:
        </span>
        {POPULAR_TOOLS.map((pt) => (
          <Link
            key={pt.label}
            href={pt.href}
            onClick={() => sounds.playClick()}
            onMouseEnter={() => sounds.playHover()}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all text-xs"
          >
            <span className="text-[10px] font-mono font-bold text-cyan-400">
              {pt.tag}
            </span>
            <span>{pt.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
