"use client";

import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Cpu,
  BookOpen,
} from "lucide-react";
import { sounds } from "./SoundFX";

interface FlagshipTool {
  id: string;
  title: string;
  category: string;
  catSlug: string;
  slug: string;
  tagline: string;
  engine: "WASM" | "Web Worker" | "WebCrypto" | "HTML5 Canvas";
  stats: string;
  gradient: string;
  borderColor: string;
}

const FLAGSHIP_TOOLS: FlagshipTool[] = [
  {
    id: "bg-remover",
    title: "AI Background Remover",
    category: "Image & Vector",
    catSlug: "image",
    slug: "background-remover",
    tagline: "Runs deep-learning ONNX vision models directly inside your browser GPU. No image uploads.",
    engine: "WASM",
    stats: "100% Local Inference",
    gradient: "from-purple-900/40 via-slate-900 to-slate-950",
    borderColor: "hover:border-purple-500/60",
  },
  {
    id: "pdf-merger",
    title: "PDF Merger & Page Reorder",
    category: "PDF Suite",
    catSlug: "pdf",
    slug: "pdf-merger",
    tagline: "Combine multiple 200MB PDFs, reorder pages, and delete spreads in isolated RAM with pdf-lib.",
    engine: "Web Worker",
    stats: "Zero Disk Footprint",
    gradient: "from-rose-900/40 via-slate-900 to-slate-950",
    borderColor: "hover:border-rose-500/60",
  },
  {
    id: "us-1099",
    title: "US 1099 Tax Engine",
    category: "Finance & Wealth",
    catSlug: "finance",
    slug: "us-1099-tax-calculator",
    tagline: "15.3% SE tax, 20% QBI deduction, and progressive brackets across all 50 US States + DC.",
    engine: "HTML5 Canvas",
    stats: "50 States + DC Live",
    gradient: "from-amber-900/40 via-slate-900 to-slate-950",
    borderColor: "hover:border-amber-500/60",
  },
  {
    id: "pdf-redactor",
    title: "Local PDF Redactor",
    category: "Legal & Compliance",
    catSlug: "legal",
    slug: "local-pdf-redactor",
    tagline: "Permanent vector blackout redactions and metadata stripping without server exposure.",
    engine: "Web Worker",
    stats: "Bank-Grade Scrubbing",
    gradient: "from-emerald-900/40 via-slate-900 to-slate-950",
    borderColor: "hover:border-emerald-500/60",
  },
  {
    id: "qr-gen",
    title: "WiFi & URL QR Generator",
    category: "Crypto & Network",
    catSlug: "crypto",
    slug: "qr-generator",
    tagline: "Vector SVG & high-res PNG codes with custom quiet-zone and error-correction levels.",
    engine: "HTML5 Canvas",
    stats: "0-Roundtrip Vector",
    gradient: "from-cyan-900/40 via-slate-900 to-slate-950",
    borderColor: "hover:border-cyan-500/60",
  },
  {
    id: "mortgage-piti",
    title: "30-Yr Mortgage PITI + PMI",
    category: "Real Estate",
    catSlug: "real-estate",
    slug: "mortgage-calculator",
    tagline: "Full amortization schedule, automatic 80% LTV PMI dropoff, and CSV export.",
    engine: "Web Worker",
    stats: "Amortization Matrix",
    gradient: "from-blue-900/40 via-slate-900 to-slate-950",
    borderColor: "hover:border-blue-500/60",
  },
];

export default function FlagshipShowcase3D() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {FLAGSHIP_TOOLS.map((tool) => (
        <div
          key={tool.id}
          onMouseEnter={() => sounds.playHover()}
          className={`group relative rounded-2xl bg-gradient-to-b ${tool.gradient} border border-slate-800/90 ${tool.borderColor} p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl flex flex-col justify-between overflow-hidden`}
        >
          {/* Subtle top indicator */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">
              {tool.category}
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-slate-700/60 text-[10px] font-mono text-slate-300">
              <Cpu size={11} className="text-cyan-400" />
              <span>{tool.engine}</span>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
              {tool.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
              {tool.tagline}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <ShieldCheck size={13} />
              <span>{tool.stats}</span>
            </span>

            <div className="flex items-center gap-2">
              <Link
                href={`/tools/${tool.catSlug}/${tool.slug}/guide/`}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded bg-slate-800/50 hover:bg-slate-800"
                title="Read Complete Specification"
              >
                <BookOpen size={12} />
                <span>Guide</span>
              </Link>
              <Link
                href={`/tools/${tool.catSlug}/${tool.slug}/`}
                onClick={() => sounds.playClick()}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-cyan-500/20"
              >
                <span>Launch</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
