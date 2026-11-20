import type { OptionField, OptionValues, PdfOp } from "./types";
import { MM, PAGE_SIZES, PAGE_SIZE_CHOICES, numberOption, pdfFile, sanitizeFor, saveDoc, type PdfDoc, type PdfFont, type PdfLib, type PdfPage, type Rgb } from "./pdf-ops-common.ts";
import { checkCurrency, invoiceTotals, parseCsv, parseInvoiceItemsCsv, parseInvoiceJson, parseLabels, parseMarkdown, wrapText, type Invoice } from "./pdf-ops-parse.ts";

interface Fonts { regular: PdfFont; bold: PdfFont; mono: PdfFont; italic: PdfFont }

/** Flowing text layout: keeps a cursor and starts new pages as needed. */
class Writer {
  readonly doc: PdfDoc;
  readonly lib: PdfLib;
  readonly fonts: Fonts;
  readonly size: [number, number];
  readonly margin: number;
  page: PdfPage;
  y: number;

  constructor(lib: PdfLib, doc: PdfDoc, fonts: Fonts, size: [number, number], margin: number) {
    this.lib = lib; this.doc = doc; this.fonts = fonts; this.size = size; this.margin = margin;
    this.page = doc.addPage(size);
    this.y = size[1] - margin;
  }

  get width(): number { return this.size[0] - this.margin * 2; }

  newPage(): void { this.page = this.doc.addPage(this.size); this.y = this.size[1] - this.margin; }

  ensure(height: number): void { if (this.y - height < this.margin && this.y < this.size[1] - this.margin) this.newPage(); }

  /** Writes wrapped text; returns nothing, moves the cursor down. */
  text(value: string, font: PdfFont, size: number, options: { indent?: number; color?: Rgb; lineGap?: number; prefix?: string; width?: number } = {}): void {
    const indent = options.indent ?? 0;
    const leading = size * (options.lineGap ?? 1.35);
    const clean = sanitizeFor(font, value);
    const lines = wrapText(clean, s => font.widthOfTextAtSize(s, size), (options.width ?? this.width) - indent);
    lines.forEach((line, index) => {
      this.ensure(leading);
      this.y -= leading;
      if (index === 0 && options.prefix) this.page.drawText(sanitizeFor(font, options.prefix), { x: this.margin + indent - font.widthOfTextAtSize(options.prefix, size) - 4, y: this.y + size * 0.25, size, font, color: options.color });
      if (line) this.page.drawText(line, { x: this.margin + indent, y: this.y + size * 0.25, size, font, color: options.color });
    });
  }

  space(points: number): void { this.y -= points; }

  rule(): void {
    this.ensure(12);
    this.y -= 6;
    this.page.drawLine({ start: { x: this.margin, y: this.y }, end: { x: this.size[0] - this.margin, y: this.y }, thickness: 0.75, color: this.lib.rgb(0.75, 0.75, 0.75) });
    this.y -= 6;
  }
}

async function standardFonts(lib: PdfLib, doc: PdfDoc, family = "Helvetica"): Promise<Fonts> {
  const f = lib.StandardFonts;
  const sets: Record<string, [string, string, string]> = { Helvetica: [f.Helvetica, f.HelveticaBold, f.HelveticaOblique], "Times-Roman": [f.TimesRoman, f.TimesRomanBold, f.TimesRomanItalic], Courier: [f.Courier, f.CourierBold, f.CourierOblique] };
  const [regular, bold, italic] = sets[family] ?? sets.Helvetica;
  return { regular: await doc.embedFont(regular), bold: await doc.embedFont(bold), italic: await doc.embedFont(italic), mono: await doc.embedFont(f.Courier) };
}

function pageSize(options: OptionValues, landscapeKey = "landscape"): [number, number] {
  const [w, h] = PAGE_SIZES[String(options.paper)] ?? PAGE_SIZES.a4;
  return options[landscapeKey] ? [h, w] : [w, h];
}

const paperField: OptionField = { id: "paper", label: "Page size", type: "select", default: "a4", choices: PAGE_SIZE_CHOICES };
const marginField: OptionField = { id: "margin", label: "Margins (mm)", type: "number", default: 20, min: 5, max: 60, step: 1 };
const fontSizeField = (value: number): OptionField => ({ id: "fontSize", label: "Font size (pt)", type: "number", default: value, min: 6, max: 36, step: 1 });
const LATIN_NOTE = "Uses the built-in PDF fonts, which cover Western European characters; other characters (for example Arabic, Chinese or emoji) are replaced with \"?\".";

async function newWriter(lib: PdfLib, options: OptionValues, family?: string, landscapeKey?: string) {
  const doc = await lib.PDFDocument.create();
  const fonts = await standardFonts(lib, doc, family);
  return new Writer(lib, doc, fonts, pageSize(options, landscapeKey), numberOption(options.margin, "Margins", 5, 60) * MM);
}

type Align = "left" | "right";

/** A simple table with wrapped cells and the header repeated on each new page. */
function drawTable(w: Writer, head: string[], rows: string[][], size: number, align: Align[] = []): void {
  const { regular, bold } = w.fonts;
  const pad = 4;
  const lineH = size * 1.25;
  const cells = (row: string[], font: PdfFont) => row.map(cell => sanitizeFor(font, cell));
  const natural = head.map((h, c) => Math.min(w.width * 0.45, Math.max(bold.widthOfTextAtSize(sanitizeFor(bold, h), size), ...rows.slice(0, 200).map(r => regular.widthOfTextAtSize(sanitizeFor(regular, r[c] ?? ""), size))) + pad * 2));
  const total = natural.reduce((a, b) => a + b, 0);
  const widths = natural.map(n => Math.max(28, (n / total) * w.width));
  const scale = w.width / widths.reduce((a, b) => a + b, 0);
  const cols = widths.map(n => n * scale);
  const maxLines = Math.floor((w.size[1] - w.margin * 2 - lineH * 4) / lineH);
  const layout = (row: string[], font: PdfFont) => cells(row, font).map((cell, c) => {
    const lines = wrapText(cell, s => font.widthOfTextAtSize(s, size), cols[c] - pad * 2);
    return lines.length > maxLines ? [...lines.slice(0, maxLines - 1), "…"] : lines;
  });
  const drawRow = (row: string[], font: PdfFont, shade: boolean) => {
    const lines = layout(row, font);
    const height = Math.max(...lines.map(l => l.length)) * lineH + pad * 2;
    if (w.y - height < w.margin) { w.newPage(); if (font !== bold) drawRow(head, bold, true); }
    if (shade) w.page.drawRectangle({ x: w.margin, y: w.y - height, width: w.width, height, color: w.lib.rgb(0.93, 0.94, 0.96) });
    let x = w.margin;
    lines.forEach((cellLines, c) => {
      cellLines.forEach((line, i) => {
        const textX = align[c] === "right" ? x + cols[c] - pad - font.widthOfTextAtSize(line, size) : x + pad;
        w.page.drawText(line, { x: textX, y: w.y - pad - (i + 1) * lineH + size * 0.3, size, font });
      });
      x += cols[c];
    });
    w.y -= height;
    w.page.drawLine({ start: { x: w.margin, y: w.y }, end: { x: w.margin + w.width, y: w.y }, thickness: 0.5, color: w.lib.rgb(0.8, 0.8, 0.8) });
  };
  drawRow(head, bold, true);
  for (const row of rows) drawRow(row, regular, false);
}

function moneyFormatter(currency: string, font: PdfFont): (value: number) => string {
  const code = checkCurrency(currency);
  let symbol: Intl.NumberFormat;
  try { symbol = new Intl.NumberFormat("en-US", { style: "currency", currency: code }); } catch { throw new Error(`"${code}" is not a currency code this browser knows.`); }
  const plain = new Intl.NumberFormat("en-US", { style: "currency", currency: code, currencyDisplay: "code" });
  const supported = new Set(font.getCharacterSet());
  return value => {
    const text = symbol.format(value);
    return Array.from(text).every(char => supported.has(char.codePointAt(0) ?? 0)) ? text : plain.format(value).replace(/ /g, " ");
  };
}

function partyLines(party: Invoice["from"]): string {
  return [party.name, party.address, party.email].filter(Boolean).join("\n");
}

async function invoicePdf(lib: PdfLib, invoice: Invoice, options: OptionValues): Promise<Uint8Array> {
  const w = await newWriter(lib, { ...options, margin: 18 });
  const { regular, bold } = w.fonts;
  const money = moneyFormatter(invoice.currency, regular);
  const totals = invoiceTotals(invoice);
  w.page.drawText("INVOICE", { x: w.margin, y: w.y - 24, size: 24, font: bold });
  const meta = [`Invoice # ${invoice.invoiceNumber}`, invoice.date && `Date: ${invoice.date}`, invoice.dueDate && `Due: ${invoice.dueDate}`].filter((line): line is string => Boolean(line));
  meta.forEach((line, i) => {
    const clean = sanitizeFor(regular, line);
    w.page.drawText(clean, { x: w.size[0] - w.margin - regular.widthOfTextAtSize(clean, 10), y: w.y - 14 - i * 14, size: 10, font: regular });
  });
  w.space(Math.max(40, meta.length * 14 + 12));
  const startY = w.y;
  const half = w.width / 2;
  w.text("FROM", bold, 9);
  w.text(partyLines(invoice.from), regular, 10, { width: half - 12 });
  const leftEnd = w.y;
  const toLines = ["BILL TO", ...partyLines(invoice.to).split("\n")];
  toLines.forEach((line, i) => w.page.drawText(sanitizeFor(i ? regular : bold, line), { x: w.margin + half, y: startY - (i + 1) * 13.5 + 2.5, size: i ? 10 : 9, font: i ? regular : bold }));
  w.y = Math.min(leftEnd, startY - toLines.length * 13.5) - 18;
  const rows = invoice.items.map((item, i) => [item.description, String(item.quantity), money(item.unitPrice), money(totals.lines[i])]);
  drawTable(w, ["Description", "Qty", "Unit price", "Amount"], rows, 10, ["left", "right", "right", "right"]);
  const summary: Array<[string, string, boolean]> = [["Subtotal", money(totals.subtotal), false]];
  if (totals.discount) summary.push(["Discount", `-${money(totals.discount)}`, false]);
  if (invoice.taxRate) summary.push([`Tax (${invoice.taxRate}%)`, money(totals.tax), false]);
  summary.push(["Total", money(totals.total), true]);
  w.space(8);
  for (const [label, value, strong] of summary) {
    w.ensure(18);
    w.y -= 16;
    const font = strong ? bold : regular;
    const size = strong ? 12 : 10;
    w.page.drawText(label, { x: w.margin + w.width * 0.55, y: w.y, size, font });
    w.page.drawText(value, { x: w.margin + w.width - font.widthOfTextAtSize(value, size) - 4, y: w.y, size, font });
  }
  if (invoice.notes) { w.space(24); w.text("NOTES", bold, 9); w.text(invoice.notes, regular, 10); }
  return saveDoc(w.doc);
}

/** Positions of an image drawn upright after an EXIF-style rotation (clockwise degrees). */
export function rotatedAnchor(rotation: number, x: number, y: number, w: number, h: number): { x: number; y: number } {
  if (rotation === 90) return { x, y: y + w };
  if (rotation === 180) return { x: x + w, y: y + h };
  if (rotation === 270) return { x: x + h, y };
  return { x, y };
}

type LabelSheet = { paper: [number, number]; cols: number; rows: number; w: number; h: number; top: number; left: number; pitchX: number; pitchY: number };
const INCH = 72;
export const LABEL_SHEETS: Record<string, LabelSheet> = {
  "avery-5160": { paper: PAGE_SIZES.letter, cols: 3, rows: 10, w: 2.625 * INCH, h: 1 * INCH, top: 0.5 * INCH, left: 0.1875 * INCH, pitchX: 2.75 * INCH, pitchY: 1 * INCH },
  "avery-l7160": { paper: PAGE_SIZES.a4, cols: 3, rows: 7, w: 63.5 * MM, h: 38.1 * MM, top: 15.15 * MM, left: 7.25 * MM, pitchX: 66.04 * MM, pitchY: 38.1 * MM },
};

function drawLabel(page: PdfPage, font: PdfFont, lines: string[], box: { x: number; y: number; w: number; h: number }, maxSize: number): void {
  const pad = 6;
  const clean = lines.map(line => sanitizeFor(font, line));
  let size = maxSize;
  while (size > 6 && (clean.some(line => font.widthOfTextAtSize(line, size) > box.w - pad * 2) || clean.length * size * 1.2 > box.h - pad * 2)) size -= 0.5;
  const blockH = clean.length * size * 1.2;
  clean.forEach((line, i) => page.drawText(line, { x: box.x + pad, y: box.y + box.h / 2 + blockH / 2 - (i + 1) * size * 1.2 + size * 0.25, size, font, maxWidth: box.w - pad * 2 }));
}

export const createOps: Record<string, PdfOp> = {
  "text-to-pdf": {
    input: "text",
    options: [paperField, { id: "font", label: "Font", type: "select", default: "Helvetica", choices: [["Helvetica", "Helvetica (sans-serif)"], ["Times-Roman", "Times (serif)"], ["Courier", "Courier (monospace)"]] }, fontSizeField(11), marginField, { id: "landscape", label: "Landscape", type: "checkbox", default: false }],
    note: LATIN_NOTE,
    async process({ text }, options, lib) {
      if (!text.trim()) throw new Error("Type or paste some text first.");
      const w = await newWriter(lib, options, String(options.font));
      w.text(text, w.fonts.regular, numberOption(options.fontSize, "Font size", 6, 36));
      return [pdfFile(await saveDoc(w.doc), "document.pdf")];
    },
  },
  "markdown-to-pdf": {
    input: "text",
    options: [paperField, fontSizeField(11), marginField],
    note: `Supports headings, paragraphs, bullet and numbered lists, quotes, code blocks and horizontal rules. Inline bold, italic and links are shown as plain text. Tables and HTML are not rendered. ${LATIN_NOTE}`,
    async process({ text }, options, lib) {
      const blocks = parseMarkdown(text);
      if (!blocks.length) throw new Error("Type or paste some Markdown first.");
      const w = await newWriter(lib, options);
      const base = numberOption(options.fontSize, "Font size", 6, 36);
      const grey = lib.rgb(0.35, 0.35, 0.35);
      for (const block of blocks) {
        if (block.kind === "heading") { w.space(base * 0.6); w.text(block.text, w.fonts.bold, base * [2, 1.6, 1.3, 1.15, 1, 0.9][block.level - 1]); w.space(base * 0.2); }
        else if (block.kind === "paragraph") { w.text(block.text, w.fonts.regular, base); w.space(base * 0.5); }
        else if (block.kind === "item") w.text(block.text, w.fonts.regular, base, { indent: 18 + block.depth * 16, prefix: block.marker });
        else if (block.kind === "quote") w.text(block.text, w.fonts.italic, base, { indent: 16, color: grey });
        else if (block.kind === "code") { w.space(4); w.text(block.lines.join("\n") || " ", w.fonts.mono, base * 0.9, { indent: 8, lineGap: 1.25 }); w.space(base * 0.6); }
        else w.rule();
      }
      return [pdfFile(await saveDoc(w.doc), "markdown.pdf")];
    },
  },
  "code-to-pdf": {
    input: "text",
    options: [paperField, fontSizeField(9), marginField, { id: "numbers", label: "Show line numbers", type: "checkbox", default: true }, { id: "landscape", label: "Landscape", type: "checkbox", default: false }],
    note: "Prints code in Courier with long lines wrapped. Tabs become 4 spaces. No syntax colouring.",
    async process({ text }, options, lib) {
      if (!text.trim()) throw new Error("Paste some code first.");
      const w = await newWriter(lib, options, "Courier");
      const size = numberOption(options.fontSize, "Font size", 6, 36);
      const lines = text.replace(/\r\n?/g, "\n").split("\n");
      const digits = String(lines.length).length;
      const gutter = options.numbers ? w.fonts.mono.widthOfTextAtSize("0".repeat(digits + 2), size) : 0;
      lines.forEach((line, index) => {
        if (options.numbers) {
          w.ensure(size * 1.3);
          w.page.drawText(String(index + 1).padStart(digits), { x: w.margin, y: w.y - size * 1.3 + size * 0.25, size, font: w.fonts.mono, color: lib.rgb(0.55, 0.55, 0.55) });
        }
        w.text(line, w.fonts.mono, size, { indent: gutter, lineGap: 1.3 });
      });
      return [pdfFile(await saveDoc(w.doc), "code.pdf")];
    },
  },
  "csv-to-pdf": {
    input: "text",
    options: [paperField, { id: "landscape", label: "Landscape", type: "checkbox", default: true }, fontSizeField(9), { ...marginField, default: 12 }, { id: "title", label: "Title (optional)", type: "text", default: "" }],
    note: `Paste CSV (comma, semicolon or tab separated). The first row is used as the header and repeated on every page. ${LATIN_NOTE}`,
    async process({ text }, options, lib) {
      const [head, ...rows] = parseCsv(text);
      const w = await newWriter(lib, options);
      if (String(options.title).trim()) { w.text(String(options.title), w.fonts.bold, 16); w.space(8); }
      drawTable(w, head, rows, numberOption(options.fontSize, "Font size", 6, 36));
      return [pdfFile(await saveDoc(w.doc), "table.pdf")];
    },
  },
  "json-invoice-to-pdf": {
    input: "text",
    options: [{ ...paperField, default: "letter" }],
    note: "Paste invoice JSON with invoiceNumber, date, dueDate, currency, from, to, items (description, quantity, unitPrice), taxRate (%), discount and notes. Totals are calculated for you; check them before sending.",
    async process({ text }, options, lib) {
      const invoice = parseInvoiceJson(text);
      return [pdfFile(await invoicePdf(lib, invoice, options), `invoice-${invoice.invoiceNumber.replace(/[^\w-]+/g, "_")}.pdf`)];
    },
  },
  "csv-invoice-to-pdf": {
    input: "text",
    options: [
      { ...paperField, default: "letter" }, { id: "number", label: "Invoice number", type: "text", default: "INV-001" }, { id: "date", label: "Invoice date", type: "text", default: "" },
      { id: "from", label: "From (your business)", type: "text", default: "Your Company LLC" }, { id: "to", label: "Bill to", type: "text", default: "Client Name" },
      { id: "currency", label: "Currency code", type: "text", default: "USD" }, { id: "taxRate", label: "Tax rate (%)", type: "number", default: 0, min: 0, max: 100, step: 0.01 },
    ],
    note: "Paste CSV line items with a header row: description, quantity, price. Totals are calculated for you; check them before sending.",
    async process({ text }, options, lib) {
      const invoice: Invoice = {
        invoiceNumber: String(options.number).trim() || "1", date: String(options.date).trim(), currency: String(options.currency),
        from: { name: String(options.from) }, to: { name: String(options.to) }, items: parseInvoiceItemsCsv(text), taxRate: numberOption(options.taxRate, "Tax rate", 0, 100), discount: 0,
      };
      return [pdfFile(await invoicePdf(lib, invoice, options), `invoice-${invoice.invoiceNumber.replace(/[^\w-]+/g, "_")}.pdf`)];
    },
  },
  "address-labels": {
    input: "text",
    options: [{ id: "sheet", label: "Label sheet", type: "select", default: "avery-5160", choices: [["avery-5160", "Avery 5160 / 8160 (US Letter, 30 per sheet)"], ["avery-l7160", "Avery L7160 (A4, 21 per sheet)"]] }, { id: "fontSize", label: "Largest font size (pt)", type: "number", default: 10, min: 6, max: 18, step: 1 }, { id: "outline", label: "Draw label outlines (for a test print)", type: "checkbox", default: false }],
    note: `Separate labels with an empty line. Print at 100% scale ("actual size"). ${LATIN_NOTE}`,
    async process({ text }, options, lib) {
      const labels = parseLabels(text);
      const sheet = LABEL_SHEETS[String(options.sheet)] ?? LABEL_SHEETS["avery-5160"];
      const doc = await lib.PDFDocument.create();
      const font = await doc.embedFont(lib.StandardFonts.Helvetica);
      const perPage = sheet.cols * sheet.rows;
      let page = doc.addPage(sheet.paper);
      labels.forEach((lines, index) => {
        if (index && index % perPage === 0) page = doc.addPage(sheet.paper);
        const slot = index % perPage;
        const box = { x: sheet.left + (slot % sheet.cols) * sheet.pitchX, y: sheet.paper[1] - sheet.top - (Math.floor(slot / sheet.cols) + 1) * sheet.pitchY + (sheet.pitchY - sheet.h), w: sheet.w, h: sheet.h };
        if (options.outline) page.drawRectangle({ x: box.x, y: box.y, width: box.w, height: box.h, borderColor: lib.rgb(0.7, 0.7, 0.7), borderWidth: 0.5 });
        drawLabel(page, font, lines, box, numberOption(options.fontSize, "Font size", 6, 18));
      });
      return [pdfFile(await saveDoc(doc), "labels.pdf")];
    },
  },
  "qr-codes-to-pdf": {
    input: "text",
    options: [paperField, { id: "columns", label: "Codes per row", type: "select", default: "3", choices: [["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"]] }, { id: "level", label: "Error correction", type: "select", default: "M", choices: [["L", "Low (7%)"], ["M", "Medium (15%)"], ["Q", "Quartile (25%)"], ["H", "High (30%)"]] }, { id: "labels", label: "Print the text under each code", type: "checkbox", default: true }],
    note: "One QR code per line (links, text, Wi-Fi strings…). Codes are vector graphics, so they print sharp at any size. Test-scan a printed code before mass printing.",
    async process({ text }, options, lib) {
      const items = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
      if (!items.length) throw new Error("Type at least one line of text or a link.");
      if (items.length > 500) throw new Error("Add at most 500 lines at a time.");
      const QRCode = await import("qrcode");
      const doc = await lib.PDFDocument.create();
      const font = await doc.embedFont(lib.StandardFonts.Helvetica);
      const [pw, ph] = PAGE_SIZES[String(options.paper)] ?? PAGE_SIZES.a4;
      const cols = Number(options.columns);
      const margin = 15 * MM;
      const cell = (pw - margin * 2) / cols;
      const labelH = options.labels ? 22 : 0;
      const rows = Math.max(1, Math.floor((ph - margin * 2) / (cell + labelH)));
      let page = doc.addPage([pw, ph]);
      items.forEach((item, index) => {
        if (index && index % (cols * rows) === 0) page = doc.addPage([pw, ph]);
        const slot = index % (cols * rows);
        const qr = QRCode.create(item, { errorCorrectionLevel: String(options.level) as "L" | "M" | "Q" | "H" });
        const count = qr.modules.size;
        const qrModule = cell / (count + 8);
        const left = margin + (slot % cols) * cell + qrModule * 4;
        const top = ph - margin - Math.floor(slot / cols) * (cell + labelH) - qrModule * 4;
        for (let row = 0; row < count; row += 1) {
          for (let col = 0; col < count; col += 1) {
            if (!qr.modules.get(row, col)) continue;
            let run = 1;
            while (col + run < count && qr.modules.get(row, col + run)) run += 1;
            page.drawRectangle({ x: left + col * qrModule, y: top - (row + 1) * qrModule, width: run * qrModule + 0.01, height: qrModule + 0.01, color: lib.rgb(0, 0, 0) });
            col += run - 1;
          }
        }
        if (options.labels) {
          const label = sanitizeFor(font, item);
          const size = 7;
          const fitted = font.widthOfTextAtSize(label, size) > cell - 8 ? `${label.slice(0, Math.max(4, Math.floor((cell - 8) / (size * 0.5)) - 1))}…` : label;
          page.drawText(fitted, { x: margin + (slot % cols) * cell + (cell - font.widthOfTextAtSize(fitted, size)) / 2, y: top - count * qrModule - qrModule * 4 - 10, size, font });
        }
      });
      return [pdfFile(await saveDoc(doc), "qr-codes.pdf")];
    },
  },
};

