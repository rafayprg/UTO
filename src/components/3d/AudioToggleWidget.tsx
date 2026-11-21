"use client";

import { useState } from "react";
import { VolumeX } from "lucide-react";
import { sounds } from "./SoundFX";

export default function AudioToggleWidget() {
  const [enabled, setEnabled] = useState(false);

  const toggleSound = () => {
    const newState = sounds.toggle();
    setEnabled(newState);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <button
        type="button"
        onClick={toggleSound}
        className={`flex items-center gap-2 px-3.5 py-2 rounded-full border shadow-2xl backdrop-blur-xl text-xs font-mono transition-all duration-300 ${
          enabled
            ? "bg-slate-900/90 border-cyan-500/50 text-cyan-300 shadow-cyan-950/60 ring-2 ring-cyan-500/20"
            : "bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
        }`}
        title={enabled ? "Mute synthesized audio" : "Enable ambient 3D sci-fi sound effects"}
      >
        {enabled ? (
          <>
            <div className="flex items-center gap-0.5 h-3">
              <span className="w-0.5 h-2 bg-cyan-400 animate-pulse" />
              <span className="w-0.5 h-3 bg-cyan-400 animate-pulse delay-75" />
              <span className="w-0.5 h-1.5 bg-cyan-400 animate-pulse delay-150" />
            </div>
            <span>Audio FX On</span>
          </>
        ) : (
          <>
            <VolumeX size={14} />
            <span>Audio Muted</span>
          </>
        )}
      </button>
    </div>
  );
}
