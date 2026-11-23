import { categories, tools, toolPath, type ToolCategory, type ToolDefinition } from "./tools-registry";

const MAX_WAVE = Number(process.env.NEXT_PUBLIC_MAX_WAVE || 2);

/** Tools that actually get a static page in this build (respects publish waves). */
export const publishedTools: ToolDefinition[] = tools.filter(
  (tool) => tool.status === "live" && (tool.publishWave ?? 1) <= MAX_WAVE,
);

export const categoryKeys = Object.keys(categories) as ToolCategory[];

export { categoryShortNames } from "./category-names";

export const categoryBlurbs: Record<ToolCategory, string> = {
  finance: "Paychecks, income tax and sales tax for every US state.",
  "real-estate": "Mortgage, rent-vs-buy and rental returns for 40 metros.",
  insurance: "Coverage estimates and refinance savings by state.",
  business: "Platform fees, margins and SaaS metrics.",
  marketing: "ROAS, CPA and campaign math.",
  legal: "NDAs, bills of sale and agreements for each state.",
  pdf: "Merge, split, redact and stamp PDFs.",
  image: "Remove backgrounds, convert HEIC, build CSS.",
  media: "Trim video, time codes and audio helpers.",
  dev: "Format JSON and SQL, test regex, read cron.",
  crypto: "Hashes, Base64 and other encodings.",
  youtube: "Titles, tags, thumbnails and RPM.",
  text: "Count, clean and convert text.",
  calculator: "Geometry, physics, stats and unit conversion.",
  data: "Convert, clean and profile CSV files.",
};

export type ToolSummary = { title: string; href: string; desc: string; group: string };

export function summarize(tool: ToolDefinition): ToolSummary {
  return { title: tool.title, href: toolPath(tool), desc: tool.shortDesc, group: tool.group };
}

export function toolsIn(category: ToolCategory): ToolDefinition[] {
  return publishedTools.filter((tool) => tool.category === category);
}

/** Trending tools first, then the rest, in registry order. */
export function popularIn(category: ToolCategory, count: number): ToolDefinition[] {
  const list = toolsIn(category);
  return [...list.filter((t) => t.trending), ...list.filter((t) => !t.trending)].slice(0, count);
}
