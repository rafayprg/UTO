"use client";

import { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Server,
  Monitor,
  ArrowRight,
  HardDrive,
  EyeOff,
  CloudOff,
  CheckCircle2,
  XCircle,
  Cpu,
} from "lucide-react";
import { sounds } from "./SoundFX";

export default function PrivacyVaultVisualizer() {
  const [activeMode, setActiveMode] = useState<"local" | "cloud">("local");
  const [simulatedFile, setSimulatedFile] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const runSimulation = (fileName: string) => {
    sounds.playClick();
    setIsSimulating(true);
    setSimulatedFile(fileName);
    setTimeout(() => {
      sounds.playChime(700, 0.12);
      setIsSimulating(false);
    }, 1200);
  };

  return (
    <div className="relative rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800/80 p-6 sm:p-10 text-slate-100 shadow-2xl overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-cyan-400 text-xs font-mono mb-4">
          <CloudOff size={13} />
          <span>ZERO-SERVER ARCHITECTURE</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-4">
          Where Does Your Data Actually Go?
        </h2>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Compare how standard web utilities handle your private contracts, tax
          numbers, and sensitive images versus our 100% client-side memory
          sandbox.
        </p>

        {/* Mode Switcher */}
        <div className="inline-flex items-center gap-1.5 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl mt-6">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveMode("local");
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeMode === "local"
                ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck size={16} />
            <span>Localtools (In-Browser Only)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveMode("cloud");
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeMode === "cloud"
                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ShieldAlert size={16} />
            <span>Traditional Cloud Utilities</span>
          </button>
        </div>
      </div>

      {/* Interactive Visual Architecture Pipeline */}
      <div className="relative max-w-4xl mx-auto mb-10 p-6 sm:p-8 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center relative z-10">
          {/* Node 1: User's Device */}
          <div className="flex flex-col items-center text-center p-5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mb-3 shadow-inner">
              <Monitor size={26} />
            </div>
            <strong className="text-white text-sm">Your Device & RAM</strong>
            <span className="text-xs text-slate-400 mt-1">
              Local Browser Instance
            </span>
            <span className="mt-2 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/60 text-slate-300">
              Host: localhost
            </span>
          </div>

          {/* Node 2: The Data Pipe / Boundary Shield */}
          <div className="flex flex-col items-center text-center py-2">
            <div className="relative w-full flex items-center justify-center">
              {activeMode === "local" ? (
                /* Local Shield: Blocks Network Egress */
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-950/80 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-pulse">
                    <ShieldCheck size={30} />
                  </div>
                  <span className="mt-3 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wide">
                    Air-Gapped Sandbox
                  </span>
                  <span className="text-[11px] text-slate-400 max-w-[200px] mt-1">
                    0 Bytes network egress. Never touches ISP or wire.
                  </span>
                </div>
              ) : (
                /* Cloud Mode: Leaks to Internet */
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-rose-950/80 border-2 border-rose-500 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/30 animate-pulse">
                    <ArrowRight size={28} className="animate-pulse" />
                  </div>
                  <span className="mt-3 text-xs font-mono font-bold text-rose-400 uppercase tracking-wide">
                    Transmitted via Internet
                  </span>
                  <span className="text-[11px] text-slate-400 max-w-[200px] mt-1">
                    Uploaded across public CDNs & remote servers.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Node 3: The Destination */}
          <div className="flex flex-col items-center text-center p-5 rounded-xl bg-slate-950/80 border border-slate-800">
            {activeMode === "local" ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-3 shadow-inner">
                  <Cpu size={26} />
                </div>
                <strong className="text-white text-sm">WebAssembly Core</strong>
                <span className="text-xs text-slate-400 mt-1">
                  Private Memory Execution
                </span>
                <span className="mt-2 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">
                  Wiped On Close
                </span>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-400 flex items-center justify-center mb-3 shadow-inner">
                  <Server size={26} />
                </div>
                <strong className="text-white text-sm">Remote Cloud Server</strong>
                <span className="text-xs text-slate-400 mt-1">
                  Database & Disk Storage
                </span>
                <span className="mt-2 text-[11px] font-mono px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/30 text-rose-300">
                  Retained For Logs
                </span>
              </>
            )}
          </div>
        </div>

        {/* Live File Simulation Bar */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Test a mock payload:</span>
            <button
              type="button"
              onClick={() => runSimulation("Confidential_Tax_Form_2026.pdf")}
              disabled={isSimulating}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors border border-slate-700"
            >
              Tax_Return.pdf
            </button>
            <button
              type="button"
              onClick={() => runSimulation("Company_Q3_Financials.xlsx")}
              disabled={isSimulating}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors border border-slate-700"
            >
              Financials.xlsx
            </button>
          </div>

          {simulatedFile && (
            <div className="text-xs font-mono flex items-center gap-2">
              <span className="text-slate-400">{simulatedFile}:</span>
              {isSimulating ? (
                <span className="text-amber-400 animate-pulse">
                  Processing locally...
                </span>
              ) : activeMode === "local" ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 size={13} /> Stayed in Local RAM (0B sent)
                </span>
              ) : (
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <XCircle size={13} /> Uploaded to remote AWS cluster!
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Feature Comparison Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
            <HardDrive size={15} className="text-cyan-400" />
            <span>Server File Retention</span>
          </div>
          <div className="text-lg font-bold">
            {activeMode === "local" ? (
              <span className="text-emerald-400">0 Seconds (Never Saved)</span>
            ) : (
              <span className="text-rose-400">Up to 30 Days in Cloud</span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {activeMode === "local"
              ? "All files evaporate the instant you close the browser tab."
              : "Saved on disk in unknown remote data centers."}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
            <CloudOff size={15} className="text-cyan-400" />
            <span>Offline Usability</span>
          </div>
          <div className="text-lg font-bold">
            {activeMode === "local" ? (
              <span className="text-emerald-400">100% Offline Ready</span>
            ) : (
              <span className="text-rose-400">Fails Without Wi-Fi</span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {activeMode === "local"
              ? "Turn off Wi-Fi or go into airplane mode. Tools keep working."
              : "Requires constant round-trips to remote backend APIs."}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
            <EyeOff size={15} className="text-cyan-400" />
            <span>AI Model Scraping</span>
          </div>
          <div className="text-lg font-bold">
            {activeMode === "local" ? (
              <span className="text-emerald-400">Mathematically Impossible</span>
            ) : (
              <span className="text-rose-400">Risk of Training Scraping</span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {activeMode === "local"
              ? "We cannot train on what we cannot see. Zero server logs."
              : "Many terms of service allow cloud vendors to retain data."}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
            <Cpu size={15} className="text-cyan-400" />
            <span>Processing Speed</span>
          </div>
          <div className="text-lg font-bold">
            {activeMode === "local" ? (
              <span className="text-emerald-400">Instant (Hardware Speed)</span>
            ) : (
              <span className="text-rose-400">Slow (Upload Queue)</span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {activeMode === "local"
              ? "Harnesses your local multi-core CPU and GPU directly."
              : "Wait for 50MB uploads and slow server processing queues."}
          </p>
        </div>
      </div>
    </div>
  );
}
