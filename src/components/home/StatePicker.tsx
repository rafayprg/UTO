"use client";

import Link from "next/link";
import { useState } from "react";

export type StateLink = { code: string; name: string; href: string };
export type StateMode = { key: string; label: string; links: StateLink[] };

export function StatePicker({ modes }: { modes: StateMode[] }) {
  const [activeKey, setActiveKey] = useState(modes[0]?.key);
  const active = modes.find((mode) => mode.key === activeKey) ?? modes[0];
  if (!active) return null;

  return (
    <div>
      <div className="lt-states-tabs" role="group" aria-label="Choose a calculator">
        {modes.map((mode) => (
          <button key={mode.key} type="button" aria-pressed={mode.key === active.key} onClick={() => setActiveKey(mode.key)}>
            {mode.label}
          </button>
        ))}
      </div>
      <nav className="lt-states" aria-label={`${active.label} by state`}>
        {active.links.map((link) => (
          <Link key={link.href} href={link.href}>
            <span>{link.code}</span>
            {link.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
