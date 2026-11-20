import type { OutputFile, PdfOp } from "./types";

// Shared helpers for the pdf-ops modules. pdf-lib arrives as a parameter, so its types are derived here.
export type PdfLib = Parameters<PdfOp["process"]>[2];
export type PdfDoc = Awaited<ReturnType<PdfLib["PDFDocument"]["load"]>>;
export type PdfPage = ReturnType<PdfDoc["getPage"]>;
export type PdfFont = Awaited<ReturnType<PdfDoc["embedFont"]>>;
export type Rgb = ReturnType<PdfLib["rgb"]>;

export const MM = 72 / 25.4;
export const PAGE_SIZES: Record<string, [number, number]> = {
  a4: [595.28, 841.89],
  letter: [612, 792],
  legal: [612, 1008],
  a5: [419.53, 595.28],
  a3: [841.89, 1190.55],
};
export const PAGE_SIZE_CHOICES: Array<[string, string]> = [["a4", "A4 (210 × 297 mm)"], ["letter", "US Letter (8.5 × 11 in)"], ["legal", "US Legal (8.5 × 14 in)"], ["a5", "A5 (148 × 210 mm)"], ["a3", "A3 (297 × 420 mm)"]];

export const baseName = (file: File | undefined) => (file?.name ?? "document").replace(/\.[a-z0-9]+$/i, "") || "document";

export function pdfFile(bytes: Uint8Array, name: string): OutputFile {
  return { blob: new Blob([bytes as BlobPart], { type: "application/pdf" }), name };
}

export function textFile(text: string, name: string, type = "text/plain"): OutputFile {
  return { blob: new Blob([text], { type: `${type};charset=utf-8` }), name };
}

/** Loads a PDF with a friendly error for encrypted or damaged files. */
export async function loadPdf(lib: PdfLib, file: File | undefined, options: { keepMetadata?: boolean; allowEncrypted?: boolean } = {}): Promise<PdfDoc> {
  if (!file) throw new Error("Choose a PDF file first.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    return await lib.PDFDocument.load(bytes, { ignoreEncryption: Boolean(options.allowEncrypted), updateMetadata: !options.keepMetadata });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/encrypt/i.test(message)) throw new Error(`"${file.name}" is password protected or encrypted. Remove the protection first, then try again.`);
    throw new Error(`"${file.name}" could not be read as a PDF. The file may be damaged or not a real PDF.`);
  }
}

export async function saveDoc(doc: PdfDoc): Promise<Uint8Array> {
  return doc.save({ useObjectStreams: true });
}

/** Copies the given zero-based pages of `source` into a new document. */
export async function copyToNew(lib: PdfLib, source: PdfDoc, indices: number[]): Promise<PdfDoc> {
  const out = await lib.PDFDocument.create();
  const pages = await out.copyPages(source, indices);
  for (const page of pages) out.addPage(page);
  return out;
}

/** Many output files are bundled into one ZIP so the download list stays usable. */
export const ZIP_AFTER = 20;
export async function bundle(files: OutputFile[], zipName: string): Promise<OutputFile[]> {
  if (files.length <= ZIP_AFTER) return files;
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const file of files) zip.file(file.name, await file.blob.arrayBuffer());
  return [{ blob: await zip.generateAsync({ type: "blob" }), name: zipName }];
}

export function numberOption(value: unknown, label: string, min: number, max: number): number {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) throw new Error(`${label} must be a number from ${min} to ${max}.`);
  return number;
}

export function hexToRgb(lib: PdfLib, hex: unknown): Rgb {
  const match = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!match) throw new Error("Colours must be written as #RRGGBB.");
  const value = parseInt(match[1], 16);
  return lib.rgb(((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255);
}

/** Standard PDF fonts only cover Windows-1252 characters; anything else becomes "?". */
export function sanitizeFor(font: PdfFont, text: string): string {
  const supported = new Set(font.getCharacterSet());
  return Array.from(text.replace(/\t/g, "    ").replace(/\r/g, ""), char => (char === "\n" || supported.has(char.codePointAt(0) ?? 0) ? char : "?")).join("");
}

export function pageRotation(page: PdfPage): number {
  return ((page.getRotation().angle % 360) + 360) % 360;
}

/** The page as the reader sees it (after /Rotate). */
export function visualSize(page: PdfPage): { width: number; height: number } {
  const box = page.getCropBox();
  const rotation = pageRotation(page);
  return rotation === 90 || rotation === 270 ? { width: box.height, height: box.width } : { width: box.width, height: box.height };
}

/** Maps a point measured on the visible page to the page's own coordinate space. */
export function visualToUser(page: PdfPage, vx: number, vy: number): { x: number; y: number; turn: number } {
  const box = page.getCropBox();
  const rotation = pageRotation(page);
  if (rotation === 90) return { x: box.x + box.width - vy, y: box.y + vx, turn: 90 };
  if (rotation === 180) return { x: box.x + box.width - vx, y: box.y + box.height - vy, turn: 180 };
  if (rotation === 270) return { x: box.x + vy, y: box.y + box.height - vx, turn: 270 };
  return { x: box.x + vx, y: box.y + vy, turn: 0 };
}

export interface VisualText { text: string; x: number; y: number; size: number; font: PdfFont; color: Rgb; opacity?: number; angle?: number }

/** Draws text whose baseline starts at (x, y) on the visible page, reading upright whatever the page rotation. */
export function drawVisualText(lib: PdfLib, page: PdfPage, spec: VisualText): void {
  const point = visualToUser(page, spec.x, spec.y);
  page.drawText(spec.text, { x: point.x, y: point.y, size: spec.size, font: spec.font, color: spec.color, opacity: spec.opacity ?? 1, rotate: lib.degrees(point.turn + (spec.angle ?? 0)) });
}

export interface Sides { top: number; right: number; bottom: number; left: number }

/** Converts margins measured on the visible page to the page's unrotated box sides. */
export function visualToUserSides(sides: Sides, rotation: number): Sides {
  if (rotation === 90) return { left: sides.top, right: sides.bottom, bottom: sides.left, top: sides.right };
  if (rotation === 180) return { left: sides.right, right: sides.left, top: sides.bottom, bottom: sides.top };
  if (rotation === 270) return { left: sides.bottom, right: sides.top, top: sides.left, bottom: sides.right };
  return { ...sides };
}

export const POSITION_CHOICES: Array<[string, string]> = [["bottom-center", "Bottom centre"], ["bottom-right", "Bottom right"], ["bottom-left", "Bottom left"], ["top-center", "Top centre"], ["top-right", "Top right"], ["top-left", "Top left"]];

/** Baseline start for a line of text at one of the six standard positions. */
export function positionText(position: string, textWidth: number, size: number, page: { width: number; height: number }, margin: number): { x: number; y: number } {
  const [vertical, horizontal] = position.split("-");
  const y = vertical === "top" ? page.height - margin - size : margin;
  const x = horizontal === "left" ? margin : horizontal === "right" ? page.width - margin - textWidth : (page.width - textWidth) / 2;
  return { x, y };
}

export function fillTemplate(template: string, page: number, total: number): string {
  return template.replace(/\{n\}|\{page\}/g, String(page)).replace(/\{total\}/g, String(total));
}
