"use client";

import Link from "next/link";
import {
  FileText,
  Calculator,
  Code,
  Shield,
  Image as ImageIcon,
  Video,
  Building,
  Briefcase,
  TrendingUp,
  ArrowRight,
  Youtube,
  Database,
  Coins,
} from "lucide-react";
import { tools, type ToolCategory } from "@/lib/tools-registry";
import { sounds } from "./SoundFX";

interface CategoryMeta {
  key: ToolCategory;
  name: string;
  desc: string;
  icon: typeof FileText;
  glowColor: string;
  accentBorder: string;
  badgeBg: string;
  badgeText: string;
  popularTools: Array<{ title: string; slug: string }>;
}

const CATEGORY_METAS: CategoryMeta[] = [
  {
    key: "pdf",
    name: "PDF & Documents",
    desc: "Merge, split, redact, watermark, and reorder pages client-side.",
    icon: FileText,
    glowColor: "rgba(244, 63, 94, 0.15)",
    accentBorder: "hover:border-rose-500/50",
    badgeBg: "bg-rose-950/60",
    badgeText: "text-rose-400",
    popularTools: [
      { title: "PDF Merger", slug: "pdf-merger" },
      { title: "Local PDF Redactor", slug: "local-pdf-redactor" },
      { title: "Bates Numbering", slug: "pdf-bates-numbering" },
    ],
  },
  {
    key: "image",
    name: "AI & Image Studio",
    desc: "Local ONNX AI background remover, HEIC to WebP/JPG, SVG generators.",
    icon: ImageIcon,
    glowColor: "rgba(168, 85, 247, 0.15)",
    accentBorder: "hover:border-purple-500/50",
    badgeBg: "bg-purple-950/60",
    badgeText: "text-purple-400",
    popularTools: [
      { title: "AI Background Remover", slug: "background-remover" },
      { title: "HEIC Converter", slug: "heic-converter" },
      { title: "SVG Wave Dividers", slug: "svg-wave-generator" },
    ],
  },
  {
    key: "dev",
    name: "Developer Utilities",
    desc: "JSON formatters, regex tester, cron builder, AST parsers, ZIP tools.",
    icon: Code,
    glowColor: "rgba(6, 182, 212, 0.15)",
    accentBorder: "hover:border-cyan-500/50",
    badgeBg: "bg-cyan-950/60",
    badgeText: "text-cyan-400",
    popularTools: [
      { title: "JSON Formatter", slug: "json-formatter" },
      { title: "ZIP Creator & Reader", slug: "zip-tool" },
      { title: "Regex Debugger", slug: "regex-tester" },
    ],
  },
  {
    key: "crypto",
    name: "Crypto & Encoding",
    desc: "WebCrypto SHA-2/3, Keccak, Base58/64, QR codes, HMAC, and ciphers.",
    icon: Shield,
    glowColor: "rgba(16, 185, 129, 0.15)",
    accentBorder: "hover:border-emerald-500/50",
    badgeBg: "bg-emerald-950/60",
    badgeText: "text-emerald-400",
    popularTools: [
      { title: "WiFi & URL QR Generator", slug: "qr-generator" },
      { title: "SHA-256 Engine", slug: "sha256-hash-generator" },
      { title: "Base64 Encoder", slug: "base64-encode-decode" },
    ],
  },
  {
    key: "finance",
    name: "Tax & Wealth",
    desc: "50 US state taxes, 1099 self-employment, UK PAYE, 401(k), and debt avalanche.",
    icon: Coins,
    glowColor: "rgba(245, 158, 11, 0.15)",
    accentBorder: "hover:border-amber-500/50",
    badgeBg: "bg-amber-950/60",
    badgeText: "text-amber-400",
    popularTools: [
      { title: "US 1099 Tax Calc", slug: "us-1099-tax-calculator" },
      { title: "401(k) Growth Engine", slug: "401k-retirement-calculator" },
      { title: "UK Take-Home Pay", slug: "uk-take-home-pay" },
    ],
  },
  {
    key: "real-estate",
    name: "Real Estate & Mortgages",
    desc: "30-Year mortgage PITI, Rent vs Buy break-even, Cap Rate, BRRRR, flips.",
    icon: Building,
    glowColor: "rgba(59, 130, 246, 0.15)",
    accentBorder: "hover:border-blue-500/50",
    badgeBg: "bg-blue-950/60",
    badgeText: "text-blue-400",
    popularTools: [
      { title: "Mortgage PITI + PMI", slug: "mortgage-calculator" },
      { title: "Rent vs Buy 30-Year", slug: "rent-vs-buy" },
      { title: "Rental Property ROI", slug: "rental-roi-calculator" },
    ],
  },
  {
    key: "calculator",
    name: "Math & Physics",
    desc: "223 calculators: geometry, physics, advanced stats, units, and dates.",
    icon: Calculator,
    glowColor: "rgba(20, 184, 166, 0.15)",
    accentBorder: "hover:border-teal-500/50",
    badgeBg: "bg-teal-950/60",
    badgeText: "text-teal-400",
    popularTools: [
      { title: "Percentage & Margin", slug: "percentage-calculator" },
      { title: "Unit & Storage Converter", slug: "unit-converter" },
      { title: "Compound Interest", slug: "compound-interest-calculator" },
    ],
  },
  {
    key: "business",
    name: "Business & Commerce",
    desc: "Amazon FBA fees, Stripe/PayPal reverse fees, SaaS LTV/CAC, and EBITDA.",
    icon: Briefcase,
    glowColor: "rgba(249, 115, 22, 0.15)",
    accentBorder: "hover:border-orange-500/50",
    badgeBg: "bg-orange-950/60",
    badgeText: "text-orange-400",
    popularTools: [
      { title: "Stripe & PayPal Fees", slug: "stripe-fee-calculator" },
      { title: "Amazon FBA Net Margin", slug: "amazon-fba-calculator" },
      { title: "SaaS Runway & Churn", slug: "saas-metrics-calculator" },
    ],
  },
  {
    key: "marketing",
    name: "Marketing & Ads",
    desc: "ROAS, Max Allowable CPA, AdSense RPM, and email open rate models.",
    icon: TrendingUp,
    glowColor: "rgba(234, 179, 8, 0.15)",
    accentBorder: "hover:border-yellow-500/50",
    badgeBg: "bg-yellow-950/60",
    badgeText: "text-yellow-400",
    popularTools: [
      { title: "Google Ads ROAS & CPA", slug: "roas-cpa-calculator" },
      { title: "AdSense & Mediavine RPM", slug: "adsense-rpm-calculator" },
      { title: "Email Deliverability", slug: "email-roi-calculator" },
    ],
  },
  {
    key: "media",
    name: "Video & Audio",
    desc: "In-browser video trimmer, audio Hz to note, SMPTE frames, and bitrate.",
    icon: Video,
    glowColor: "rgba(236, 72, 153, 0.15)",
    accentBorder: "hover:border-pink-500/50",
    badgeBg: "bg-pink-950/60",
    badgeText: "text-pink-400",
    popularTools: [
      { title: "In-Browser Video Trimmer", slug: "video-trimmer" },
      { title: "Audio Hz to Note", slug: "audio-hz-to-note" },
      { title: "Video Bitrate Calc", slug: "video-bitrate-calculator" },
    ],
  },
  {
    key: "youtube",
    name: "YouTube Creators",
    desc: "5-tier thumbnail harvest, SRT caption cleaning, and CPM revenue models.",
    icon: Youtube,
    glowColor: "rgba(239, 68, 68, 0.15)",
    accentBorder: "hover:border-red-500/50",
    badgeBg: "bg-red-950/60",
    badgeText: "text-red-400",
    popularTools: [
      { title: "Thumbnail & SRT Toolkit", slug: "youtube-toolkit" },
      { title: "YouTube Revenue CPM", slug: "youtube-revenue-calculator" },
      { title: "Caption Cleaner", slug: "youtube-subtitle-extractor" },
    ],
  },
  {
    key: "data",
    name: "Data & In-Browser SQL",
    desc: "CSV/JSON/SQL conversions, deduplication, transpositions, and profilers.",
    icon: Database,
    glowColor: "rgba(132, 204, 22, 0.15)",
    accentBorder: "hover:border-lime-500/50",
    badgeBg: "bg-lime-950/60",
    badgeText: "text-lime-400",
    popularTools: [
      { title: "CSV to JSON / SQL", slug: "csv-to-json" },
      { title: "Data Deduplicator", slug: "data-deduplicator" },
      { title: "CSV Column Profiler", slug: "csv-profiler" },
    ],
  },
];

export default function CategoryGalaxy({
  onSelectTheme,
}: {
  onSelectTheme?: (theme: "cyan" | "emerald" | "violet" | "ruby" | "amber") => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {CATEGORY_METAS.map((cat) => {
        const Icon = cat.icon;
        const totalCount = tools.filter((t) => t.category === cat.key).length;

        return (
          <div
            key={cat.key}
            onMouseEnter={() => {
              sounds.playHover();
              if (onSelectTheme) {
                if (cat.key === "crypto" || cat.key === "finance")
                  onSelectTheme("emerald");
                else if (cat.key === "pdf" || cat.key === "youtube")
                  onSelectTheme("ruby");
                else if (cat.key === "image" || cat.key === "media")
                  onSelectTheme("violet");
                else if (cat.key === "calculator") onSelectTheme("amber");
                else onSelectTheme("cyan");
              }
            }}
            className={`group relative rounded-2xl bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-900/90 border border-slate-800/80 ${cat.accentBorder} p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between`}
            style={{
              boxShadow: `0 10px 30px -10px ${cat.glowColor}`,
            }}
          >
            <div>
              {/* Top Row: Icon + Count Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-100 group-hover:scale-110 transition-transform">
                  <Icon size={22} />
                </div>
                <span
                  className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-full border border-slate-700/60 ${cat.badgeBg} ${cat.badgeText}`}
                >
                  {totalCount} Tools
                </span>
              </div>

              {/* Title & Description */}
              <Link href={`/tools/${cat.key}/`} className="block group-hover:text-cyan-300 transition-colors">
                <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                  <span>{cat.name}</span>
                  <ArrowRight
                    size={15}
                    className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-cyan-400"
                  />
                </h3>
              </Link>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                {cat.desc}
              </p>
            </div>

            {/* Popular Tool Pills */}
            <div className="pt-3 border-t border-slate-800/80">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-2">
                Featured Flagships:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {cat.popularTools.map((tool) => (
                  <Link
                    key={tool.slug}
                    href={`/tools/${cat.key}/${tool.slug}/`}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-800/70 hover:bg-cyan-950/70 border border-slate-700/70 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-all"
                  >
                    {tool.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
