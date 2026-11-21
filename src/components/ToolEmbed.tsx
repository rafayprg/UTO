import Link from "next/link";
import { getTool, toolPath } from "@/lib/tools-registry";

export function ToolEmbed({ slug }: { slug?: string }) {
  if (!slug) return null;
  const tool = getTool(slug);
  if (!tool) return null;

  return (
    <aside className="embed">
      <p className="eyebrow">COMPANION TOOL</p>
      <h3>{tool.title}</h3>
      <p>{tool.shortDesc}</p>
      <Link className="text-link" href={toolPath(tool)}>
        Explore this tool →
      </Link>
    </aside>
  );
}
