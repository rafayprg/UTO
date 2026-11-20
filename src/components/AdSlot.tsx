"use client";

import React, { useEffect, useRef } from "react";

interface AdSlotProps {
  slotId?: string;
  format?: "auto" | "rectangle" | "horizontal";
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

export function AdSlot({ slotId, format = "auto", className = "" }: AdSlotProps) {
  const isEnabled = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";
  const adRef = useRef<HTMLModElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!isEnabled || !clientId || initialized.current) return;
    try {
      if (typeof window !== "undefined" && adRef.current) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        initialized.current = true;
      }
    } catch {
      // Gracefully ignore script/ad-blocker blocks
    }
  }, [isEnabled, clientId]);

  if (!isEnabled) {
    return null;
  }

  const heightClass = format === "horizontal" ? "min-h-[90px]" : "min-h-[280px]";

  return (
    <aside
      className={`ad-slot-container ${heightClass} ${className}`}
      aria-label="Advertisement"
      style={{
        contain: "layout style",
        overflow: "hidden",
      }}
    >
      <span className="ad-label text-[10px] uppercase tracking-wider text-slate-400 select-none pb-1">
        Advertisement
      </span>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", width: "100%", height: "100%" }}
        data-ad-client={clientId || undefined}
        data-ad-slot={slotId || undefined}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </aside>
  );
}
