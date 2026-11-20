import type { OutputFile, PdfOp } from "./types";
import { PAGE_SIZES, baseName, bundle, copyToNew, loadPdf, numberOption, pageRotation, pdfFile, saveDoc, type PdfDoc, type PdfLib, type PdfPage } from "./pdf-ops-common.ts";
import { bookletPairs, chunkPages, interleaveOrder, parsePageSet, parseRangeGroups, parseRanges, reorderPages } from "./pdf-ops-ranges.ts";

type EmbeddedPage = Awaited<ReturnType<PdfDoc["embedPage"]>>;

const rangeField = (label: string, example: string) => ({ id: "pages", label, type: "text" as const, default: example, placeholder: "1-3, 5, 8-end", hint: "Commas separate ranges. \"8-end\" runs to the last page." });

async function single(lib: PdfLib, file: File, indices: number[], suffix: string, source: PdfDoc): Promise<OutputFile[]> {
  const out = await copyToNew(lib, source, indices);
  return [pdfFile(await saveDoc(out), `${baseName(file)}-${suffix}.pdf`)];
}

async function splitGroups(lib: PdfLib, file: File, source: PdfDoc, groups: number[][]): Promise<OutputFile[]> {
  const files: OutputFile[] = [];
  for (const [index, group] of groups.entries()) {
    const out = await copyToNew(lib, source, group);
    const label = group.length === 1 ? `page-${group[0] + 1}` : `pages-${group[0] + 1}-${group[group.length - 1] + 1}`;
    files.push(pdfFile(await saveDoc(out), `${baseName(file)}-part${index + 1}-${label}.pdf`));
  }
  return bundle(files, `${baseName(file)}-split.zip`);
}

/** Draws a page so it appears upright inside a box of its visual size × scale with its lower-left corner at (x, y). */
export function drawUpright(lib: PdfLib, target: PdfPage, embedded: EmbeddedPage, rotation: number, x: number, y: number, scale: number): void {
  const w = embedded.width * scale;
  const h = embedded.height * scale;
  const anchor = rotation === 90 ? { x, y: y + w } : rotation === 180 ? { x: x + w, y: y + h } : rotation === 270 ? { x: x + h, y } : { x, y };
  target.drawPage(embedded, { x: anchor.x, y: anchor.y, xScale: scale, yScale: scale, rotate: lib.degrees(-rotation) });
}

function uprightSize(embedded: EmbeddedPage, rotation: number): { width: number; height: number } {
  const { width, height } = embedded;
  return rotation === 90 || rotation === 270 ? { width: height, height: width } : { width, height };
}

async function nUp(lib: PdfLib, source: PdfDoc, perSheet: number, sheet: [number, number]): Promise<PdfDoc> {
  const out = await lib.PDFDocument.create();
  const pages = source.getPages();
  const embedded = await out.embedPages(pages);
  const [cols, rows] = perSheet === 2 ? [2, 1] : perSheet === 4 ? [2, 2] : [3, 3];
  const [sheetW, sheetH] = perSheet === 2 ? [sheet[1], sheet[0]] : sheet;
  const margin = 18;
  const cellW = (sheetW - margin * 2) / cols;
  const cellH = (sheetH - margin * 2) / rows;
  for (let start = 0; start < pages.length; start += perSheet) {
    const target = out.addPage([sheetW, sheetH]);
    for (let slot = 0; slot < perSheet && start + slot < pages.length; slot += 1) {
      const rotation = pageRotation(pages[start + slot]);
      const size = uprightSize(embedded[start + slot], rotation);
      const scale = Math.min((cellW - 8) / size.width, (cellH - 8) / size.height);
      const col = slot % cols;
      const row = Math.floor(slot / cols);
      const x = margin + col * cellW + (cellW - size.width * scale) / 2;
      const y = sheetH - margin - (row + 1) * cellH + (cellH - size.height * scale) / 2;
      drawUpright(lib, target, embedded[start + slot], rotation, x, y, scale);
    }
  }
  return out;
}

async function booklet(lib: PdfLib, source: PdfDoc, sheet: [number, number]): Promise<PdfDoc> {
  const out = await lib.PDFDocument.create();
  const pages = source.getPages();
  const embedded = await out.embedPages(pages);
  const [sheetW, sheetH] = [sheet[1], sheet[0]];
  const half = sheetW / 2;
  for (const pair of bookletPairs(pages.length)) {
    const target = out.addPage([sheetW, sheetH]);
    pair.forEach((index, side) => {
      if (index < 0) return;
      const rotation = pageRotation(pages[index]);
      const size = uprightSize(embedded[index], rotation);
      const scale = Math.min((half - 24) / size.width, (sheetH - 24) / size.height);
      const x = side * half + (half - size.width * scale) / 2;
      const y = (sheetH - size.height * scale) / 2;
      drawUpright(lib, target, embedded[index], rotation, x, y, scale);
    });
  }
  return out;
}

const sheetChoice = { id: "sheet", label: "Sheet size", type: "select" as const, default: "a4", choices: [["a4", "A4"], ["letter", "US Letter"], ["a3", "A3"]] as Array<[string, string]> };

export const organizeOps: Record<string, PdfOp> = {
  "split-by-range": {
    input: "pdf",
    options: [rangeField("Ranges (one new PDF per range)", "1-3, 4-end")],
    note: "Each comma-separated range becomes its own PDF. More than 20 files are delivered as one ZIP.",
    async process({ files }, options, lib) {
      const source = await loadPdf(lib, files[0]);
      return splitGroups(lib, files[0], source, parseRangeGroups(String(options.pages), source.getPageCount()));
    },
  },
  "split-every-n": {
    input: "pdf",
    options: [{ id: "size", label: "Pages per file", type: "number", default: 2, min: 1, max: 500, step: 1 }],
    note: "The last file holds whatever pages are left. More than 20 files are delivered as one ZIP.",
    async process({ files }, options, lib) {
      const source = await loadPdf(lib, files[0]);
      return splitGroups(lib, files[0], source, chunkPages(source.getPageCount(), Number(options.size)));
    },
  },
  "split-single-pages": {
    input: "pdf",
    note: "Every page becomes a separate PDF. More than 20 pages are delivered as one ZIP.",
    async process({ files }, _options, lib) {
      const source = await loadPdf(lib, files[0]);
      return splitGroups(lib, files[0], source, chunkPages(source.getPageCount(), 1));
    },
  },
  "delete-pages": {
    input: "pdf",
    options: [rangeField("Pages to delete", "2, 5-6")],
    async process({ files }, options, lib) {
      const source = await loadPdf(lib, files[0]);
      const remove = new Set(parsePageSet(String(options.pages), source.getPageCount()));
      const keep = source.getPageIndices().filter(index => !remove.has(index));
      if (!keep.length) throw new Error("That would delete every page. Leave at least one page.");
      return single(lib, files[0], keep, "edited", source);
    },
  },
  "extract-pages": {
    input: "pdf",
    options: [rangeField("Pages to extract (in this order)", "1-2, 4")],
    async process({ files }, options, lib) {
      const source = await loadPdf(lib, files[0]);
      return single(lib, files[0], parseRanges(String(options.pages), source.getPageCount()), "extract", source);
    },
  },
  "reorder-pages": {
    input: "pdf",
    options: [rangeField("New page order", "3, 1, 2"), { id: "keepRest", label: "Add pages I did not list at the end", type: "checkbox", default: true }],
    note: "Type the order you want, for example \"3, 1, 2, 4-end\".",
    async process({ files }, options, lib) {
      const source = await loadPdf(lib, files[0]);
      return single(lib, files[0], reorderPages(String(options.pages), source.getPageCount(), Boolean(options.keepRest)), "reordered", source);
    },
  },
  "odd-even-pages": {
    input: "pdf",
    options: [{ id: "which", label: "Pages to keep", type: "select", default: "odd", choices: [["odd", "Odd pages (1, 3, 5…)"], ["even", "Even pages (2, 4, 6…)"]] }],
    async process({ files }, options, lib) {
      const source = await loadPdf(lib, files[0]);
      const remainder = options.which === "even" ? 1 : 0;
      const pages = source.getPageIndices().filter(index => index % 2 === remainder);
      if (!pages.length) throw new Error("This PDF has no even pages.");
      return single(lib, files[0], pages, String(options.which), source);
    },
  },
  "rotate-selected": {
    input: "pdf",
    options: [rangeField("Pages to rotate", "1, 3"), { id: "angle", label: "Rotation", type: "select", default: "90", choices: [["90", "90° clockwise"], ["180", "180°"], ["270", "90° counter-clockwise"]] }],
    async process({ files }, options, lib) {
      const doc = await loadPdf(lib, files[0]);
      const angle = Number(options.angle);
      for (const index of parsePageSet(String(options.pages), doc.getPageCount())) {
        const page = doc.getPage(index);
        page.setRotation(lib.degrees((pageRotation(page) + angle) % 360));
      }
      return [pdfFile(await saveDoc(doc), `${baseName(files[0])}-rotated.pdf`)];
    },
  },
  "duplicate-pages": {
    input: "pdf",
    options: [rangeField("Pages to duplicate", "1"), { id: "copies", label: "Extra copies of each page", type: "number", default: 1, min: 1, max: 50, step: 1 }, { id: "place", label: "Place copies", type: "select", default: "after", choices: [["after", "Right after each original"], ["end", "At the end of the document"]] }],
    async process({ files }, options, lib) {
      const source = await loadPdf(lib, files[0]);
      const picked = new Set(parsePageSet(String(options.pages), source.getPageCount()));
      const copies = numberOption(options.copies, "Extra copies", 1, 50);
      const repeat = (index: number) => Array.from({ length: copies }, () => index);
      const order = options.place === "end"
        ? [...source.getPageIndices(), ...[...picked].flatMap(repeat)]
        : source.getPageIndices().flatMap(index => (picked.has(index) ? [index, ...repeat(index)] : [index]));
      return single(lib, files[0], order, "duplicated", source);
    },
  },
  "reverse-pages": {
    input: "pdf",
    async process({ files }, _options, lib) {
      const source = await loadPdf(lib, files[0]);
      return single(lib, files[0], source.getPageIndices().reverse(), "reversed", source);
    },
  },
  "insert-blank-page": {
    input: "pdf",
    options: [
      { id: "after", label: "Insert after page (0 = before the first page)", type: "number", default: 1, min: 0, step: 1 },
      { id: "count", label: "Number of blank pages", type: "number", default: 1, min: 1, max: 100, step: 1 },
      { id: "size", label: "Blank page size", type: "select", default: "match", choices: [["match", "Same as the neighbouring page"], ["a4", "A4"], ["letter", "US Letter"]] },
    ],
    async process({ files }, options, lib) {
      const doc = await loadPdf(lib, files[0]);
      const total = doc.getPageCount();
      const after = numberOption(options.after, "Insert after page", 0, total);
      const count = numberOption(options.count, "Number of blank pages", 1, 100);
      const neighbour = doc.getPage(Math.max(0, Math.min(total - 1, after - 1)));
      const size: [number, number] = options.size === "match" ? [neighbour.getWidth(), neighbour.getHeight()] : PAGE_SIZES[String(options.size)];
      for (let i = 0; i < count; i += 1) {
        const blank = doc.insertPage(Math.floor(after), size);
        if (options.size === "match") blank.setRotation(lib.degrees(pageRotation(neighbour)));
      }
      return [pdfFile(await saveDoc(doc), `${baseName(files[0])}-with-blank.pdf`)];
    },
  },
  "interleave-pages": {
    input: "pdfs",
    options: [{ id: "reverseB", label: "Second PDF is in reverse order (back sides scanned last-to-first)", type: "checkbox", default: true }],
    note: "Add exactly two PDFs: the first holds the front sides, the second the back sides. Pages are mixed A1, B1, A2, B2…",
    async process({ files }, options, lib) {
      if (files.length !== 2) throw new Error("Add exactly two PDFs: fronts first, then backs.");
      const [a, b] = [await loadPdf(lib, files[0]), await loadPdf(lib, files[1])];
      const out = await lib.PDFDocument.create();
      const pagesA = await out.copyPages(a, a.getPageIndices());
      const pagesB = await out.copyPages(b, b.getPageIndices());
      for (const [file, index] of interleaveOrder(pagesA.length, pagesB.length, Boolean(options.reverseB))) out.addPage((file === 0 ? pagesA : pagesB)[index]);
      return [pdfFile(await saveDoc(out), `${baseName(files[0])}-interleaved.pdf`)];
    },
  },
  "insert-pdf": {
    input: "pdfs",
    options: [{ id: "after", label: "Insert the second PDF after page (0 = at the start)", type: "number", default: 1, min: 0, step: 1 }],
    note: "Add two PDFs: the main document first, then the one to insert.",
    async process({ files }, options, lib) {
      if (files.length !== 2) throw new Error("Add exactly two PDFs: the main document first, then the one to insert.");
      const [main, insert] = [await loadPdf(lib, files[0]), await loadPdf(lib, files[1])];
      const after = Math.floor(numberOption(options.after, "Insert after page", 0, main.getPageCount()));
      const out = await lib.PDFDocument.create();
      const mainPages = await out.copyPages(main, main.getPageIndices());
      const insertPages = await out.copyPages(insert, insert.getPageIndices());
      for (const page of [...mainPages.slice(0, after), ...insertPages, ...mainPages.slice(after)]) out.addPage(page);
      return [pdfFile(await saveDoc(out), `${baseName(files[0])}-combined.pdf`)];
    },
  },
  "n-up": {
    input: "pdf",
    options: [{ id: "per", label: "Pages per sheet", type: "select", default: "2", choices: [["2", "2 (side by side, landscape)"], ["4", "4 (2 × 2)"], ["9", "9 (3 × 3)"]] }, sheetChoice],
    note: "Pages are drawn as vector content, so text stays sharp. Links and form fields are not carried over.",
    async process({ files }, options, lib) {
      const source = await loadPdf(lib, files[0]);
      const out = await nUp(lib, source, Number(options.per), PAGE_SIZES[String(options.sheet)]);
      return [pdfFile(await saveDoc(out), `${baseName(files[0])}-${options.per}-up.pdf`)];
    },
  },
  booklet: {
    input: "pdf",
    options: [sheetChoice],
    note: "Pages are padded to a multiple of 4 and arranged for saddle-stitch printing: print double-sided (flip on short edge), fold, and staple.",
    async process({ files }, options, lib) {
      const source = await loadPdf(lib, files[0]);
      const out = await booklet(lib, source, PAGE_SIZES[String(options.sheet)]);
      return [pdfFile(await saveDoc(out), `${baseName(files[0])}-booklet.pdf`)];
    },
  },
};
