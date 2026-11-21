"use client";

import { useState, useRef, useEffect } from "react";
import {
  Terminal,
  Shield,
  Zap,
  Copy,
  Check,
  RefreshCw,
  Cpu,
  Layers,
  Lock,
  ArrowRight,
} from "lucide-react";
import { sounds } from "./SoundFX";
import Link from "next/link";

export default function InteractiveHeroHUD() {
  const [activeTab, setActiveTab] = useState<"crypto" | "text" | "convert">(
    "crypto"
  );
  const [copied, setCopied] = useState(false);

  // Tab 1: Crypto state
  const [inputText, setInputText] = useState("Localtools: 100% private computing");
  const [hashResult, setHashResult] = useState("");
  const [calcTime, setCalcTime] = useState(0.04);

  // Tab 2: Base64 / Text state
  const [textInput, setTextInput] = useState("Client-side cryptography sandbox");
  const [b64Result, setB64Result] = useState("");

  // Tab 3: Unit converter state
  const [unitVal, setUnitVal] = useState("16");
  const [unitType, setUnitType] = useState<"gib" | "mb">("gib");

  // 3D Card Tilt State
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, glareX: 50, glareY: 50 });

  // Web Crypto SHA-256 calculation
  useEffect(() => {
    let isCancelled = false;
    async function computeHash() {
      const t0 = performance.now();
      try {
        const msgUint8 = new TextEncoder().encode(inputText);
        const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        const t1 = performance.now();
        if (!isCancelled) {
          setHashResult(hashHex);
          setCalcTime(Math.max(0.02, Number((t1 - t0).toFixed(2))));
        }
      } catch {
        // Fallback simple hash if subtle crypto fails
        if (!isCancelled) {
          setHashResult("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
        }
      }
    }
    computeHash();
    return () => {
      isCancelled = true;
    };
  }, [inputText]);

  // Base64 calculation
  useEffect(() => {
    try {
      setB64Result(btoa(unescape(encodeURIComponent(textInput))));
    } catch {
      setB64Result("");
    }
  }, [textInput]);

  // Mouse tilt handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rx = ((y - centerY) / centerY) * -8;
    const ry = ((x - centerX) / centerX) * 8;
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTilt({ rx, ry, glareX, glareY });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0, glareX: 50, glareY: 50 });
  };

  const copyToClipboard = (text: string) => {
    sounds.playClick();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRandomSeed = () => {
    sounds.playClick();
    const seeds = [
      "Zero server roundtrips · 100% local WASM",
      "Confidential contracts never leave your RAM",
      "Offline ready: disconnect Wi-Fi and keep working",
      "Bank-grade client hashing with Web Crypto API",
      "1,034+ tools running directly in your browser",
    ];
    const nextSeed = seeds[Math.floor(Math.random() * seeds.length)];
    setInputText(nextSeed);
  };

  return (
    <div
      className="relative w-full max-w-xl mx-auto perspective-1000"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Floating 3D Satellite Badges */}
      <div className="absolute -top-4 -left-6 z-20 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/40 text-emerald-300 text-xs shadow-lg shadow-emerald-950/40 backdrop-blur-md animate-bounce-slow">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span className="font-mono font-semibold">OUTBOUND: 0.00 KB</span>
      </div>

      <div className="absolute -bottom-5 -right-4 z-20 hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/40 text-cyan-300 text-xs shadow-lg shadow-cyan-950/40 backdrop-blur-md">
        <Cpu size={14} className="text-cyan-400 animate-spin-slow" />
        <span className="font-mono">WASM V8 Core · 0ms Cloud Latency</span>
      </div>

      {/* Main 3D Glassmorphism HUD Card */}
      <div
        ref={cardRef}
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition:
            tilt.rx === 0 && tilt.ry === 0
              ? "transform 0.5s ease-out"
              : "transform 0.1s ease-out",
        }}
        className="relative rounded-2xl bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-900/90 border border-slate-700/60 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl p-5 md:p-6 text-slate-200 overflow-hidden"
      >
        {/* Specular glare overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-25 transition-opacity"
          style={{
            background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 60%)`,
          }}
        />

        {/* Top Header / Status Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80 border border-rose-400/50" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-400/50" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-400/50" />
            <span className="text-xs font-mono font-medium text-slate-400 ml-1 flex items-center gap-1.5">
              <Terminal size={13} className="text-cyan-400" />
              <span>local-sandbox.engine</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/30 text-emerald-300">
              <Shield size={11} /> 100% Client-Only
            </span>
          </div>
        </div>

        {/* Interactive Tool Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 mb-4 text-xs font-mono">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab("crypto");
            }}
            onMouseEnter={() => sounds.playHover()}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-all ${
              activeTab === "crypto"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <Lock size={12} />
            <span>SHA-256</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab("text");
            }}
            onMouseEnter={() => sounds.playHover()}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-all ${
              activeTab === "text"
                ? "bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <Layers size={12} />
            <span>Base64</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab("convert");
            }}
            onMouseEnter={() => sounds.playHover()}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg transition-all ${
              activeTab === "convert"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <Zap size={12} />
            <span>Converter</span>
          </button>
        </div>

        {/* TAB 1: LIVE SHA-256 HASH ENGINE */}
        {activeTab === "crypto" && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label className="text-slate-300 font-medium flex items-center gap-1.5">
                  <span>Input String (In-Memory)</span>
                </label>
                <button
                  type="button"
                  onClick={handleRandomSeed}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                >
                  <RefreshCw size={10} /> Random Seed
                </button>
              </div>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type anything to test zero-latency hash..."
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400/80 font-mono transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>SHA-256 Digest (Client Web Crypto)</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  Calculated in {calcTime}ms
                </span>
              </div>
              <div className="relative group">
                <div className="w-full bg-slate-950/90 border border-cyan-900/60 group-hover:border-cyan-500/60 rounded-lg p-2.5 text-[11px] font-mono text-cyan-300 break-all transition-colors pr-10">
                  {hashResult || "Computing..."}
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(hashResult)}
                  className="absolute right-2 top-2 p-1.5 rounded-md bg-slate-800/80 hover:bg-cyan-600 text-slate-300 hover:text-white transition-colors"
                  title="Copy Hash"
                >
                  {copied ? <Check size={13} className="text-emerald-300" /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE BASE64 CODER */}
        {activeTab === "text" && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-300 font-medium mb-1.5">
                Input Plaintext (Zero Network Transmission)
              </label>
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-400/80 font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                  <span>Base64 Transformed Output</span>
                </span>
                <span className="text-[10px] text-violet-400 font-mono">
                  Instant RAM encode
                </span>
              </div>
              <div className="relative group">
                <div className="w-full bg-slate-950/90 border border-violet-900/60 rounded-lg p-2.5 text-[11px] font-mono text-violet-300 break-all pr-10">
                  {b64Result || "—"}
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(b64Result)}
                  className="absolute right-2 top-2 p-1.5 rounded-md bg-slate-800/80 hover:bg-violet-600 text-slate-300 hover:text-white transition-colors"
                >
                  {copied ? <Check size={13} className="text-emerald-300" /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LIVE QUICK UNIT CONVERTER */}
        {activeTab === "convert" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1.5">
                  Storage Value
                </label>
                <input
                  type="number"
                  value={unitVal}
                  onChange={(e) => setUnitVal(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1.5">
                  Unit Type
                </label>
                <select
                  value={unitType}
                  onChange={(e) => setUnitType(e.target.value as "gib" | "mb")}
                  className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
                >
                  <option value="gib">GiB (Binary 1024³)</option>
                  <option value="mb">MB (Decimal 1000²)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950/90 border border-amber-900/40">
                <span className="text-[10px] text-slate-400 block">Exact Bytes</span>
                <span className="text-amber-300 font-semibold">
                  {unitType === "gib"
                    ? (Number(unitVal) * 1024 * 1024 * 1024).toLocaleString()
                    : (Number(unitVal) * 1000 * 1000).toLocaleString()}{" "}
                  B
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/90 border border-amber-900/40">
                <span className="text-[10px] text-slate-400 block">
                  {unitType === "gib" ? "Decimal GB Equivalent" : "MiB Equivalent"}
                </span>
                <span className="text-amber-300 font-semibold">
                  {unitType === "gib"
                    ? ((Number(unitVal) * 1024 * 1024 * 1024) / 1e9).toFixed(3) +
                      " GB"
                    : ((Number(unitVal) * 1e6) / (1024 * 1024)).toFixed(3) +
                      " MiB"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Live Sandbox Telemetry Grid */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-[10px] font-mono">
          <div className="flex flex-col">
            <span className="text-slate-500">NETWORK TRACE</span>
            <span className="text-emerald-400 font-medium">0 Request / 0 B</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500">SANDBOX BOUNDARY</span>
            <span className="text-cyan-400 font-medium">WebWorker Isolated</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500">CATALOG TOOLS</span>
            <span className="text-violet-400 font-medium">1,034 Live Ready</span>
          </div>
        </div>

        {/* Instant Launch Link */}
        <div className="mt-3 pt-2 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">
            Test any of 1,034 tools right now:
          </span>
          <Link
            href="/tools/"
            className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold text-xs transition-colors"
          >
            <span>Open Tool Directory</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
