import type { CalcModuleKey, ImageModuleKey, PdfModuleKey, TextModuleKey } from "../ops/load";

/** What a "coming soon" tool will take as input, so its workspace preview looks right. */
export type PlannedInput = "pdf" | "image" | "video" | "audio" | "text" | "csv" | "spreadsheet" | "database" | "camera" | "microphone" | "screen";

interface BaseEntry {
  /** URL slug, unique across the whole site, kebab-case. */
  slug: string;
  /** Page title, e.g. "Base64 Encoder". */
  title: string;
  /** One sentence, under 120 characters, plain US English. */
  shortDesc: string;
  keywords: string[];
  /** Main tool group from the blueprint, e.g. "Encoders & Decoders". */
  group: string;
}

export type CatalogEntry = BaseEntry & (
  | { engine: "text"; module: TextModuleKey; op: string }
  | { engine: "calc"; module: CalcModuleKey; op: string }
  | { engine: "image"; module: ImageModuleKey; op: string }
  | { engine: "pdf"; module: PdfModuleKey; op: string }
  /** Frontend only: the processing engine is added in a later phase. */
  | { engine: "planned"; plannedEngine: string; plannedInput: PlannedInput }
);
