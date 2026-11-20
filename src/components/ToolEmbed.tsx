import Link from "next/link";
import { getTool, toolPath } from "@/lib/tools-registry";
export function ToolEmbed({ slug }: { slug: string }) { const tool = getTool(slug); if (!tool) throw new Error(`Unknown embedded tool: ${slug}`); return <aside className="embed"><p className="eyebrow">COMPANION TOOL</p><h3>{tool.title}</h3><p>{tool.shortDesc}</p><Link className="text-link" href={toolPath(tool)}>Explore this tool →</Link></aside>; }
