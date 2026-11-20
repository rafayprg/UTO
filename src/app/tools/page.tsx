import { Metadata } from "next";
import { ToolDirectory } from "@/components/ToolDirectory";
import { CategoryNav } from "@/components/CategoryNav";
import { PrivacyBadge } from "@/components/PrivacyBadge";
import { tools, liveTools, categories } from "@/lib/tools-registry";
import { Shapes, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "All Tools & Web Apps Directory (1,034+ Free Apps) — Localtools",
  description: "Browse our complete directory of 1,034+ client-side tools and calculators across 20 suites. Zero server uploads, completely free, and works privately in your browser.",
  alternates: { canonical: "/tools/" },
};

export default function ToolsDirectoryPage() {
  const categoryCount = Object.keys(categories).length;

  return (
    <div className="app-layout">
      <CategoryNav />
      <main className="hub-main">
        <header className="page-intro">
          <span className="tool-icon large">
            <Shapes size={28} />
          </span>
          <p className="eyebrow">
            <Sparkles size={13} /> COMPLETE DIRECTORY · {liveTools.length} LIVE APPS
          </p>
          <h1>All Tools & Applications</h1>
          <p>
            Explore all {tools.length} browser-native tools across {categoryCount} specialized suites.
            Every tool runs 100% on your device with zero server processing or account requirements.
          </p>
        </header>

        <PrivacyBadge />

        <ToolDirectory />
      </main>
    </div>
  );
}
