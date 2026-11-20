// Shared operation contracts for the data-driven tool engines.
// Every ops module (src/lib/ops/*.ts) is self-contained: it may only use `import type`
// from this file, so the modules run unchanged in the browser and in Node tests.

export type OptionValue = string | number | boolean;
export type OptionValues = Record<string, OptionValue>;

export type OptionField =
  | { id: string; label: string; type: "select"; choices: Array<[value: string, label: string]>; default: string; hint?: string }
  | { id: string; label: string; type: "number"; default: number; min?: number; max?: number; step?: number; hint?: string }
  | { id: string; label: string; type: "range"; default: number; min: number; max: number; step?: number; hint?: string }
  | { id: string; label: string; type: "text"; default: string; placeholder?: string; hint?: string }
  | { id: string; label: string; type: "checkbox"; default: boolean; hint?: string }
  | { id: string; label: string; type: "color"; default: string; hint?: string };

/** Text in, text out. Generators set `input: false`. */
export interface TextOp {
  input?: false | { label: string; placeholder?: string; example: string; rows?: number; accept?: string };
  /** Optional second text area, e.g. the "changed" side of a diff. */
  second?: { label: string; placeholder?: string; example: string };
  options?: OptionField[];
  outputLabel?: string;
  /** File extension for "Download" (without the dot). Defaults to txt. */
  outputExt?: string;
  /** Render the output as a live CSS preview (declarations applied to a sample box) or a colour swatch. */
  preview?: "css" | "color" | "html-text";
  /** Heavy or random operations run on a button press instead of on every keystroke. */
  manual?: boolean;
  note?: string;
  run(input: string, options: OptionValues, second?: string): string | Promise<string>;
}

export interface CalcField {
  id: string;
  label: string;
  type: "number" | "select" | "date" | "text";
  default: string;
  choices?: Array<[value: string, label: string]>;
  step?: string;
  hint?: string;
}
export interface CalcResult { label: string; value: string; primary?: boolean }
export interface CalcOutput { results: CalcResult[]; formula?: string; table?: { head: string[]; rows: string[][] } }
/** Form in, results out. `compute` throws an Error with a friendly message for invalid input. */
export interface CalcOp {
  fields: CalcField[];
  note?: string;
  compute(values: Record<string, string>): CalcOutput;
}

export interface OutputFile { blob: Blob; name: string }

/** One or more images in, generated files out (runs in the browser with Canvas). */
export interface ImageOp {
  options?: OptionField[];
  multiple?: boolean;
  accept?: string;
  note?: string;
  process(files: File[], options: OptionValues): Promise<OutputFile[]>;
}

/** Files (PDF/images) or text in, files out, using pdf-lib loaded on demand. */
export interface PdfOp {
  input: "pdf" | "pdfs" | "images" | "text";
  options?: OptionField[];
  note?: string;
  process(input: { files: File[]; text: string }, options: OptionValues, pdfLib: typeof import("pdf-lib")): Promise<OutputFile[]>;
}

export type TextModule = { ops: Record<string, TextOp> };
export type CalcModule = { ops: Record<string, CalcOp> };
export type ImageModule = { ops: Record<string, ImageOp> };
export type PdfModule = { ops: Record<string, PdfOp> };
