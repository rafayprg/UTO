import { publishedTools } from "@/lib/published";
import { toolPath } from "@/lib/tools-registry";

export const dynamic = "force-static";

// [title, path, category, keywords] — kept as tuples so the file stays small.
export function GET() {
  const index = publishedTools.map((tool) => [
    tool.title,
    toolPath(tool),
    tool.category,
    tool.keywords.slice(0, 6).join(" "),
  ]);
  return Response.json(index);
}
