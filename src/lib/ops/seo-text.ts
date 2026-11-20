import type { TextOp } from "./types";
import { caseOps, lineOps, listOps } from "./seo-text-case.ts";
import { countOps, readabilityOps } from "./seo-text-count.ts";
import { schemaOps } from "./seo-text-schema.ts";
import { tagOps } from "./seo-text-tags.ts";
import { advancedTextOps } from "./text-advanced.ts";

export const ops: Record<string, TextOp> = {
  ...caseOps,
  ...lineOps,
  ...listOps,
  ...countOps,
  ...readabilityOps,
  ...schemaOps,
  ...tagOps,
  ...advancedTextOps,
};
