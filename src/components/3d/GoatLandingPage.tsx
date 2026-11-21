"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  Sparkles,
  Cpu,
  Layers,
  BookOpen,
  Activity,
} from "lucide-react";
import InteractiveHeroHUD from "./InteractiveHeroHUD";
import HeroSearch from "./HeroSearch";
import PrivacyVaultVisualizer from "./PrivacyVaultVisualizer";
import ClientBenchmarkStation from "./ClientBenchmarkStation";
import CategoryGalaxy from "./CategoryGalaxy";
import FlagshipShowcase3D from "./FlagshipShowcase3D";
import AudioToggleWidget from "./AudioToggleWidget";
import { sounds } from "./SoundFX";

// Dynamic load for Three.js canvas to guarantee client-only execution
const Hero3DCanvas = dynamic(() => import("./Hero3DCanvas"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-slate-950 flex items-center justify-center">
      <div className="w-16 h-16 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
    </div>
  ),
});

export default function GoatLandingPage() {
  const [activeTheme, setActiveTheme] = useState<
    "cyan" | "emerald" | "violet" | "ruby" | "amber"
  >("cyan");


  const handleThemeChange = (
    theme: "cyan" | "emerald" | "violet" | "ruby" | "amber"
  ) => {
    sounds.playClick();
    setActiveTheme(theme);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950 cyber-grid-bg relative overflow-x-hidden font-sans">
      {/* =========================================================================
          1. HERO SECTION WITH 3D WEBGL CORE & INTERACTIVE HUD
          ========================================================================= */}
      <section className="relative min-h-[92vh] flex items-center justify-center pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Interactive 3D WebGL Canvas Background */}
        <Hero3DCanvas activeTheme={activeTheme} />

        {/* Ambient Top Glow Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[300px] bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Vision & Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Live Privacy Beacon */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 shadow-lg shadow-cyan-950/40 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-mono font-semibold tracking-wider text-cyan-300 uppercase">
                AIR-GAPPED BROWSER WORKSPACE · ZERO SERVER UPLOADS
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl xl:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
              1,034+ In-Browser Tools.
              <br />
              <span className="hero-gradient-text">
                Zero Data Leaves Your Device.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
              Merge PDFs, remove backgrounds, calculate 1099 taxes, and encrypt
              data with 100% private in-browser memory execution. Powered by
              WebAssembly, Web Crypto, and GPU shaders. Completely free forever
              with zero sign-ups.
            </p>

            {/* Hero Instant Quick Search Bar */}
            <div className="pt-1 pb-2">
              <HeroSearch />
            </div>

            {/* Primary Action Buttons & Compact 3D Atmosphere Selector */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/tools/"
                onClick={() => sounds.playClick()}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-xl shadow-cyan-500/25 active:scale-95"
              >
                <span>Launch Matrix (1,034 Tools)</span>
                <ArrowRight size={16} />
              </Link>

              <a
                href="#benchmark"
                onClick={() => sounds.playClick()}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-sm transition-all hover:border-slate-600 shadow-lg"
              >
                <Activity size={15} className="text-cyan-400" />
                <span>Test Hardware Speed</span>
              </a>

              {/* Compact Atmosphere Selector */}
              <div className="inline-flex items-center gap-1.5 p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-mono text-slate-400">
                <span className="px-2 text-[11px] text-slate-400 flex items-center gap-1">
                  <Sparkles size={11} className="text-cyan-400" /> Atmosphere:
                </span>
                {(
                  [
                    { id: "cyan", label: "Cyan", dot: "bg-cyan-400" },
                    { id: "emerald", label: "Emerald", dot: "bg-emerald-400" },
                    { id: "violet", label: "Violet", dot: "bg-violet-400" },
                    { id: "ruby", label: "Ruby", dot: "bg-rose-400" },
                    { id: "amber", label: "Amber", dot: "bg-amber-400" },
                  ] as const
                ).map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => handleThemeChange(th.id)}
                    className={`px-2 py-1 rounded-lg text-[11px] transition-all flex items-center gap-1 ${
                      activeTheme === th.id
                        ? "bg-slate-800 text-white font-semibold border border-slate-700 shadow-sm"
                        : "hover:text-slate-200"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${th.dot}`} />
                    <span>{th.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Stats Strip with Glass Tiles */}
            <div className="pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
                <strong className="block text-2xl sm:text-3xl font-extrabold text-white font-mono">
                  1,034+
                </strong>
                <span className="text-xs text-slate-400">
                  Browser-Native Tools
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
                <strong className="block text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono">
                  15
                </strong>
                <span className="text-xs text-slate-400">
                  Specialized Suites
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
                <strong className="block text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
                  0 KB
                </strong>
                <span className="text-xs text-slate-400">
                  Cloud Server Uploads
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
                <strong className="block text-2xl sm:text-3xl font-extrabold text-violet-400 font-mono">
                  100%
                </strong>
                <span className="text-xs text-slate-400">
                  Free & Account-Free
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Perspective Interactive HUD */}
          <div className="lg:col-span-5 flex justify-center">
            <InteractiveHeroHUD />
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. HARDWARE BENCHMARK STATION (Interactive Client Speed Test)
          ========================================================================= */}
      <section id="benchmark" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <ClientBenchmarkStation />
      </section>

      {/* =========================================================================
          3. PRIVACY VAULT & AIR-GAPPED BOUNDARY VISUALIZER
          ========================================================================= */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <PrivacyVaultVisualizer />
      </section>

      {/* =========================================================================
          4. 3D CATEGORY GALAXY (15 Specialized Tool Suites)
          ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-cyan-400 text-xs font-mono mb-3">
              <Layers size={13} />
              <span>THE 15 SPECIALIZED SUITES</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Explore Our Tool Galaxy
            </h2>
            <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-xl">
              From vector PDF redactors and 50-state tax engines to WebCrypto
              hashes and client-side ONNX machine learning.
            </p>
          </div>

          <Link
            href="/tools/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sm font-semibold text-slate-200 transition-all hover:border-cyan-500/50"
          >
            <span>View All 1,034 Tools</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        <CategoryGalaxy onSelectTheme={setActiveTheme} />
      </section>

      {/* =========================================================================
          5. FLAGSHIP 3D SHOWCASE (Top In-Browser Engines)
          ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-violet-400 text-xs font-mono mb-3">
            <Sparkles size={13} />
            <span>BESPOKE CLIENT ENGINES</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Flagship Client-Side Powerhouses
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-3">
            Built from scratch with client-side Web Workers, WebAssembly, and
            specialized vector algorithms. No compromises on precision or privacy.
          </p>
        </div>

        <FlagshipShowcase3D />
      </section>

      {/* =========================================================================
          6. HOW IT WORKS (3-STEP CLIENT-SIDE FLOW)
          ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-cyan-400 text-xs font-mono mb-3">
            <Cpu size={13} />
            <span>LOCAL ARCHITECTURE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How Local-First Productivity Works
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mt-2">
            Three simple steps to absolute data privacy and hardware-speed processing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-slate-700 transition-all">
            <span className="text-4xl font-extrabold font-mono text-cyan-500/40 block mb-4">
              01
            </span>
            <h3 className="text-xl font-bold text-white mb-2">
              Select Any Tool
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Use our instant command palette (<kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[11px] text-cyan-300 font-mono">⌘K / Ctrl+K</kbd>)
              or category directory to access any of 1,034 specialized utilities.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-slate-700 transition-all">
            <span className="text-4xl font-extrabold font-mono text-emerald-500/40 block mb-4">
              02
            </span>
            <h3 className="text-xl font-bold text-white mb-2">
              Process Locally in RAM
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Drop your confidential PDFs, enter tax brackets, or hash credentials.
              Calculations execute directly in memory with WebAssembly and WebCrypto.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 hover:border-slate-700 transition-all">
            <span className="text-4xl font-extrabold font-mono text-violet-500/40 block mb-4">
              03
            </span>
            <h3 className="text-xl font-bold text-white mb-2">
              Export Clean Results
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Download your modified documents, copy sanitized code, or review
              financial amortization schedules instantly with zero watermarks.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. DEDICATED GUIDES & SPECIFICATIONS HIGHLIGHT
          ========================================================================= */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-3xl bg-gradient-to-r from-blue-950/70 via-indigo-950/60 to-purple-950/70 border border-indigo-800/40 p-8 sm:p-12 overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/60 border border-indigo-700/60 text-indigo-300 text-xs font-mono mb-4">
              <BookOpen size={13} />
              <span>THE 1,034 GUIDE LIBRARY</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">
              Every Single Tool Has Its Own Complete Technical Guide.
            </h2>
            <p className="text-indigo-200/80 text-sm sm:text-base leading-relaxed mb-6">
              We never leave you guessing with blank input boxes. Every single tool
              in our 1,034 catalog features an exhaustive specification: step-by-step
              walkthroughs, underlying mathematical formulas, worked case studies,
              and common pitfalls.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/blog/"
                className="px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs uppercase tracking-wide transition-all shadow-lg"
              >
                Browse Guide Library &rarr;
              </Link>
              <Link
                href="/tools/insurance/life-insurance-calculator/guide/"
                className="text-xs font-mono text-indigo-200 hover:text-white underline underline-offset-4"
              >
                Inspect Sample Guide (Life Insurance DIME) &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. FREQUENTLY ASKED QUESTIONS
          ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-slate-900">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-400 text-sm">
            Everything you need to know about our client-side architecture.
          </p>
        </div>

        <div className="space-y-4">
          <details className="group rounded-2xl bg-slate-900/60 border border-slate-800 p-5 transition-all open:bg-slate-900/90">
            <summary className="font-semibold text-sm sm:text-base text-slate-200 cursor-pointer list-none flex items-center justify-between">
              <span>Are my files or calculations ever uploaded to your servers?</span>
              <span className="text-cyan-400 font-mono text-xl group-open:rotate-45 transition-transform">
                +
              </span>
            </summary>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mt-3 pt-3 border-t border-slate-800/80">
              No. Never. Every single tool operates entirely in your browser using
              JavaScript, Web Workers, and WebAssembly. When you drag and drop a PDF,
              format confidential code, or enter sensitive financial figures, the data
              never leaves your device’s memory.
            </p>
          </details>

          <details className="group rounded-2xl bg-slate-900/60 border border-slate-800 p-5 transition-all open:bg-slate-900/90">
            <summary className="font-semibold text-sm sm:text-base text-slate-200 cursor-pointer list-none flex items-center justify-between">
              <span>Why do you offer 1,034+ tools for free without mandatory accounts?</span>
              <span className="text-cyan-400 font-mono text-xl group-open:rotate-45 transition-transform">
                +
              </span>
            </summary>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mt-3 pt-3 border-t border-slate-800/80">
              Because client-side architecture costs virtually zero in heavy server compute.
              Since your machine does the processing, we don’t need multi-million dollar GPU
              clusters to process your files. We believe essential productivity tools should
              be open, private, and accessible to everyone.
            </p>
          </details>

          <details className="group rounded-2xl bg-slate-900/60 border border-slate-800 p-5 transition-all open:bg-slate-900/90">
            <summary className="font-semibold text-sm sm:text-base text-slate-200 cursor-pointer list-none flex items-center justify-between">
              <span>Can I use these tools completely offline?</span>
              <span className="text-cyan-400 font-mono text-xl group-open:rotate-45 transition-transform">
                +
              </span>
            </summary>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mt-3 pt-3 border-t border-slate-800/80">
              Yes! Once a tool page is loaded in your browser cache, you can disconnect
              your Wi-Fi, board an airplane, or work in an air-gapped security room.
              The calculation logic, converters, and formatters will continue working uninterrupted.
            </p>
          </details>

          <details className="group rounded-2xl bg-slate-900/60 border border-slate-800 p-5 transition-all open:bg-slate-900/90">
            <summary className="font-semibold text-sm sm:text-base text-slate-200 cursor-pointer list-none flex items-center justify-between">
              <span>How accurate are the financial, mortgage, and tax tools?</span>
              <span className="text-cyan-400 font-mono text-xl group-open:rotate-45 transition-transform">
                +
              </span>
            </summary>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mt-3 pt-3 border-t border-slate-800/80">
              Our calculators are built using industry-standard formulas (such as
              standard amortization schedules, the DIME method for life insurance,
              and official progressive tax brackets across all 50 US States + DC).
              Each tool includes a dedicated formula breakdown and worked examples.
            </p>
          </details>
        </div>
      </section>

      {/* =========================================================================
          9. BOTTOM CALL TO ACTION
          ========================================================================= */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="relative rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-10 sm:p-16 overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none" />
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Ready for a Faster, 100% Private Workspace?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto mb-8">
            Experience the future of client-side web utilities. No signups, no trackers,
            and zero bytes leaving your computer.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/tools/"
              onClick={() => sounds.playClick()}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm tracking-wide shadow-xl shadow-cyan-500/20 active:scale-95 transition-all"
            >
              <span>Explore All 1,034 Tools & Apps</span>
              <ArrowRight size={17} />
            </Link>
            <Link
              href="/blog/"
              className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-all"
            >
              <BookOpen size={16} />
              <span>Read Tool Guides</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Floating Web Audio Controller */}
      <AudioToggleWidget />
    </div>
  );
}
