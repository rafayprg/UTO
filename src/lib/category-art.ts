import { existsSync } from "node:fs";
import path from "node:path";
import type { ToolCategory } from "./tools-registry";

/** Where category artwork lives. Drop `<category>.webp` files here; pages pick them up on the next build. */
export const CATEGORY_ART_DIR = "images/categories";

/**
 * Public URL of a category's artwork, or null when the file is not in `public/` yet.
 * Runs at build time only (static export), so a missing image never ships a broken <img>.
 */
export function categoryArt(category: ToolCategory): string | null {
  const relative = `${CATEGORY_ART_DIR}/${category}.webp`;
  const onDisk = path.join(process.cwd(), "public", relative);
  return existsSync(onDisk) ? `/${relative}` : null;
}
