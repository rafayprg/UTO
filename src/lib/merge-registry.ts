// src/lib/merge-registry.ts — Strict Skip-Existing Guard & Wave-Gating
import { MANUAL_TOOLS, type ToolDefinition } from "./tools-registry";
import { generateProgrammaticTools } from "./programmatic-tools";

// Collect all existing slugs from manual/handcrafted and catalog tools
const existingSlugs = new Set(MANUAL_TOOLS.map((t) => t.slug));

// Generate programmatic tools and strictly skip any existing slug
const NEW_PROGRAMMATIC_TOOLS: ToolDefinition[] = generateProgrammaticTools().filter(
  (tool) => !existingSlugs.has(tool.slug)
);

// Unified tools registry with 100% preservation of handcrafted tools
export const ALL_TOOLS: ToolDefinition[] = [
  ...MANUAL_TOOLS,
  ...NEW_PROGRAMMATIC_TOOLS,
];

// Re-export for standard access
export const tools = ALL_TOOLS;
export const liveTools = ALL_TOOLS.filter((t) => t.status === "live");

/**
 * Returns wave-gated tools to prevent crawl-budget overload
 * and comply with 2026 search indexing best practices.
 */
export function getWaveGatedTools(maxWave?: number): ToolDefinition[] {
  const currentMaxWave =
    maxWave ?? Number(process.env.NEXT_PUBLIC_MAX_WAVE || 2);
  return ALL_TOOLS.filter((t) => (t.publishWave ?? 1) <= currentMaxWave);
}

export const getToolFromAll = (slug: string) =>
  ALL_TOOLS.find((t) => t.slug === slug);
