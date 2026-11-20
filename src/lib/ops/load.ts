import type { CalcModule, ImageModule, PdfModule, TextModule } from "./types";

// Each loader is a separate chunk, so a tool page only downloads the ops for its own suite.
export const textModules = {
  "dev-text": () => import("./dev-text"),
  "data-text": () => import("./data-text"),
  "crypto-text": () => import("./crypto-text"),
  "seo-text": () => import("./seo-text"),
  "youtube-text": () => import("./youtube-text"),
  "media-text": () => import("./media-text"),
  "image-css": () => import("./image-css"),
} satisfies Record<string, () => Promise<TextModule>>;

export const calcModules = {
  "calc-finance": () => import("./calc-finance"),
  "calc-math": () => import("./calc-math"),
  "calc-units": () => import("./calc-units"),
  "youtube-calc": () => import("./youtube-calc"),
  "calc-business": () => import("./calc-business"),
  "calc-marketing": () => import("./calc-marketing"),
  "calc-realestate": () => import("./calc-realestate"),
  "calc-insurance": () => import("./calc-insurance"),
} satisfies Record<string, () => Promise<CalcModule>>;

export const imageModules = {
  "image-ops": () => import("./image-ops"),
} satisfies Record<string, () => Promise<ImageModule>>;

export const pdfModules = {
  "pdf-ops": () => import("./pdf-ops"),
} satisfies Record<string, () => Promise<PdfModule>>;

export type TextModuleKey = keyof typeof textModules;
export type CalcModuleKey = keyof typeof calcModules;
export type ImageModuleKey = keyof typeof imageModules;
export type PdfModuleKey = keyof typeof pdfModules;
export type OpsModuleKey = TextModuleKey | CalcModuleKey | ImageModuleKey | PdfModuleKey;
