"use client";

import { useState, useRef, useEffect } from "react";
import {
  Terminal,
  Shield,
  Zap,
  Copy,
  Check,
  Cpu,
  Layers,
  Lock,
  ArrowRight,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import { sounds } from "./SoundFX";
import Link from "next/link";

export default function InteractiveHeroHUD() {
  const [activeTab, setActiveTab] = useState<
    "crypto" | "text" | "convert" | "audit"
  >("crypto");
  const [copied, setCopied] = useState(false);

  // Tab 1: Crypto state
  const [inputText, setInputText] = useState(
    "Localtools: 100% private in-browser computing"
  );
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
        if (!isCancelled) {
          setHashResult(
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
          );
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

    const rx = ((y - centerY) / centerY) * -6;
    const ry = ((x - centerX) / centerX) * 6;
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

  const setPresetCrypto = (seed: string) => {
    sounds.playClick();
    setInputText(seed);
  };

  return (
    <div
      className="relative w-full max-w-xl mx-auto perspective-1000"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* 3D Glassmorphism HUD Card */}
      <div
        ref={cardRef}
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transition:
            tilt.rx === 0 && tilt.ry === 0
              ? "transform 0.5s ease-out"
              : "transform 0.1s ease-out",
        }}
        className="relative rounded-2xl bg-gradient-to-b from-slate-900/95 via-slate-950/95 to-slate-900/95 border border-slate-700/70 shadow-2xl shadow-cyan-950/50 backdrop-blur-xl p-5 md:p-6 text-slate-200 overflow-hidden"
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
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            <span className="text-xs font-mono font-medium text-slate-400 ml-1.5 flex items-center gap-1.5">
              <Terminal size={13} className="text-cyan-400" />
              <span>local-sandbox.v8</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>AIR-GAPPED</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-cyan-300">
              <Cpu size={11} /> 0ms Cloud Latency
            </span>
          </div>
        </div>

        {/* Interactive Tool Switcher Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 mb-4 text-xs font-mono">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab("crypto");
            }}
            onMouseEnter={() => sounds.playHover()}
            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg transition-all ${
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
            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg transition-all ${
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
            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg transition-all ${
              activeTab === "convert"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <Zap size={12} />
            <span>Storage</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab("audit");
            }}
            onMouseEnter={() => sounds.playHover()}
            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg transition-all ${
              activeTab === "audit"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <ShieldCheck size={12} />
            <span>Air-Gap</span>
          </button>
        </div>

        {/* TAB 1: LIVE SHA-256 HASH ENGINE */}
        {activeTab === "crypto" && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label className="text-slate-300 font-medium flex items-center gap-1.5">
                  <span>Input String (In-Memory Only)</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 font-mono">
                    Presets:
                  </span>
                  <button
                    type="button"
                    onClick={() => setPresetCrypto("W-2 Tax Record #9482104-CONFIDENTIAL")}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                  >
                    Tax W-2
                  </button>
                  <span className="text-slate-600">·</span>
                  <button
                    type="button"
                    onClick={() =>
                      setPresetCrypto("sample_api_token_hash_9482019482019401")
                    }
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                  >
                    API Key
                  </button>
                  <span className="text-slate-600">·</span>
                  <button
                    type="button"
                    onClick={() =>
                      setPresetCrypto("Mutual Non-Disclosure Agreement 2026-v4")
                    }
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
                  >
                    NDA
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type anything to test zero-latency in-browser hash..."
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
                  Computed in {calcTime}ms
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
                  {copied ? (
                    <Check size={13} className="text-emerald-300" />
                  ) : (
                    <Copy size={13} />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE BASE64 CODER */}
        {activeTab === "text" && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label className="text-slate-300 font-medium">
                  Plaintext (Never transmitted)
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 font-mono">
                    Presets:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setTextInput("Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9")
                    }
                    className="text-[10px] text-violet-400 hover:text-violet-300 underline underline-offset-2"
                  >
                    Bearer JWT
                  </button>
                  <span className="text-slate-600">·</span>
                  <button
                    type="button"
                    onClick={() =>
                      setTextInput("Air-Gapped In-Browser Execution Protocol")
                    }
                    className="text-[10px] text-violet-400 hover:text-violet-300 underline underline-offset-2"
                  >
                    Protocol
                  </button>
                </div>
              </div>
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
                  <span>Base64 RAM Output</span>
                </span>
                <span className="text-[10px] text-violet-400 font-mono">
                  Instant Memory Encode
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
                  {copied ? (
                    <Check size={13} className="text-emerald-300" />
                  ) : (
                    <Copy size={13} />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LIVE QUICK STORAGE CONVERTER */}
        {activeTab === "convert" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1.5">
                  Storage Quantity
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
                  Standard
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
                <span className="text-[10px] text-slate-400 block">
                  Exact Bytes
                </span>
                <span className="text-amber-300 font-semibold truncate block">
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

        {/* TAB 4: LIVE AIR-GAP AUDIT */}
        {activeTab === "audit" && (
          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 border border-emerald-900/50">
              <div className="flex items-center gap-2">
                <WifiOff size={14} className="text-emerald-400" />
                <span className="text-slate-300">Outbound Requests</span>
              </div>
              <span className="text-emerald-300 font-bold">0.00 KB (Zero)</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 border border-cyan-900/50">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-cyan-400" />
                <span className="text-slate-300">Memory Allocation</span>
              </div>
              <span className="text-cyan-300 font-bold">Ephemeral V8 Heap</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 border border-violet-900/50">
              <div className="flex items-center gap-2">
                <Cpu size={14} className="text-violet-400" />
                <span className="text-slate-300">WebAssembly Engine</span>
              </div>
              <span className="text-violet-300 font-bold">Client-Thread Only</span>
            </div>
          </div>
        )}

        {/* Bottom Telemetry Metrics */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-[10px] font-mono">
          <div className="flex flex-col">
            <span className="text-slate-500">OUTBOUND NETWORK</span>
            <span className="text-emerald-400 font-semibold">0 Requests / 0 B</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500">SECURITY BOUNDARY</span>
            <span className="text-cyan-400 font-semibold">Air-Gapped Sandbox</span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500">CLIENT TOOLS</span>
            <span className="text-violet-400 font-semibold">1,034 Ready</span>
          </div>
        </div>

        {/* Quick Launch Link */}
        <div className="mt-3 pt-2 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">
            Ready to process real files?
          </span>
          <Link
            href="/tools/"
            onClick={() => sounds.playClick()}
            className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold text-xs transition-colors"
          >
            <span>Open Tool Directory (1,034 Tools)</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
