import type { TextOp } from "./types";
import { linkOps } from "./youtube-text-links.ts";
import { seoOps } from "./youtube-text-seo.ts";
import { captionOps } from "./youtube-text-captions.ts";

export const ops: Record<string, TextOp> = { ...linkOps, ...seoOps, ...captionOps };
