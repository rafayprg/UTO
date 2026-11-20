export function AdSlot() { if (process.env.NEXT_PUBLIC_ADS_ENABLED !== "true") return null; return <aside className="ad-slot" aria-label="Advertisement"><span>Advertisement</span></aside>; }
