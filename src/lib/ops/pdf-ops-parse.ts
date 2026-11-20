// Pure text parsers used by the "create a PDF" tools. No pdf-lib here, so they are easy to test.

/** RFC 4180 CSV with quoted fields. The delimiter (comma, semicolon or tab) is detected from the first line. */
export function parseCsv(text: string): string[][] {
  const source = text.replace(/^﻿/, "");
  const firstLine = source.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = [",", ";", "\t"].map(d => [d, firstLine.split(d).length] as const).sort((a, b) => b[1] - a[1])[0][0];
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === "\"" && source[i + 1] === "\"") { cell += "\""; i += 1; }
      else if (char === "\"") quoted = false;
      else cell += char;
    } else if (char === "\"" && cell === "") quoted = true;
    else if (char === delimiter) { row.push(cell); cell = ""; }
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[i + 1] === "\n") i += 1;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += char;
  }
  if (quoted) throw new Error("The CSV has an opening quote (\") that is never closed.");
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  const filled = rows.filter(r => r.some(value => value.trim() !== ""));
  if (!filled.length) throw new Error("The CSV is empty.");
  const width = Math.max(...filled.map(r => r.length));
  return filled.map(r => [...r, ...Array.from({ length: width - r.length }, () => "")]);
}

export type MdBlock =
  | { kind: "heading"; level: number; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "item"; text: string; marker: string; depth: number }
  | { kind: "quote"; text: string }
  | { kind: "code"; lines: string[] }
  | { kind: "rule" };

/** Removes inline Markdown markers: bold, italic, code spans, links and images. */
export function stripInline(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, (_, alt: string) => (alt ? `[image: ${alt}]` : "[image]"))
    .replace(/\[([^\]]+)\]\(([^)\s]+)[^)]*\)/g, (_, label: string, url: string) => (label === url ? url : `${label} (${url})`))
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(^|[^*\w])\*(?!\s)([^*]+?)\*(?!\w)/g, "$1$2")
    .replace(/(^|\W)_(?!\s)([^_]+?)_(?!\w)/g, "$1$2")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\\([\\`*_{}[\]()#+\-.!])/g, "$1");
}

/** A practical CommonMark subset: headings, paragraphs, lists, quotes, fenced code and rules. */
export function parseMarkdown(text: string): MdBlock[] {
  const blocks: MdBlock[] = [];
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  let paragraph: string[] = [];
  const flush = () => { if (paragraph.length) blocks.push({ kind: "paragraph", text: stripInline(paragraph.join(" ")) }); paragraph = []; };
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const fence = /^\s*(```|~~~)/.exec(line);
    if (fence) {
      flush();
      const code: string[] = [];
      for (i += 1; i < lines.length && !lines[i].trimStart().startsWith(fence[1]); i += 1) code.push(lines[i]);
      blocks.push({ kind: "code", lines: code });
      continue;
    }
    const heading = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    const item = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line);
    if (!line.trim()) flush();
    else if (heading) { flush(); blocks.push({ kind: "heading", level: heading[1].length, text: stripInline(heading[2]) }); }
    else if (/^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(line)) { flush(); blocks.push({ kind: "rule" }); }
    else if (item) { flush(); blocks.push({ kind: "item", depth: Math.floor(item[1].replace(/\t/g, "    ").length / 2), marker: /\d/.test(item[2]) ? item[2] : "•", text: stripInline(item[3]) }); }
    else if (/^\s*>/.test(line)) { flush(); blocks.push({ kind: "quote", text: stripInline(line.replace(/^\s*>\s?/, "")) }); }
    else paragraph.push(line.trim());
  }
  flush();
  return blocks;
}

export interface InvoiceParty { name: string; address?: string; email?: string }
export interface InvoiceItem { description: string; quantity: number; unitPrice: number }
export interface Invoice {
  invoiceNumber: string; date: string; dueDate?: string; currency: string;
  from: InvoiceParty; to: InvoiceParty; items: InvoiceItem[]; taxRate: number; discount: number; notes?: string;
}
export interface InvoiceTotals { lines: number[]; subtotal: number; discount: number; tax: number; total: number }

const cents = (value: number) => Math.round(value * 100) / 100;

export function invoiceTotals(invoice: Invoice): InvoiceTotals {
  const lines = invoice.items.map(item => cents(item.quantity * item.unitPrice));
  const subtotal = cents(lines.reduce((sum, value) => sum + value, 0));
  const discount = cents(Math.min(invoice.discount, subtotal));
  const tax = cents((subtotal - discount) * invoice.taxRate / 100);
  return { lines, subtotal, discount, tax, total: cents(subtotal - discount + tax) };
}

function toNumber(value: unknown, label: string): number {
  const number = typeof value === "string" ? Number(value.replace(/[,\s$€£]/g, "")) : Number(value);
  if (!Number.isFinite(number)) throw new Error(`${label} must be a number.`);
  return number;
}

function party(value: unknown, label: string): InvoiceParty {
  if (typeof value === "string" && value.trim()) return { name: value.trim() };
  if (!value || typeof value !== "object" || typeof (value as InvoiceParty).name !== "string") throw new Error(`"${label}" needs at least a "name".`);
  const p = value as Record<string, unknown>;
  return { name: String(p.name), address: p.address ? String(p.address) : undefined, email: p.email ? String(p.email) : undefined };
}

export function checkCurrency(code: string): string {
  const upper = code.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(upper)) throw new Error("Currency must be a 3-letter ISO code such as USD, EUR or GBP.");
  return upper;
}

function item(value: unknown, index: number): InvoiceItem {
  const raw = (value ?? {}) as Record<string, unknown>;
  const description = String(raw.description ?? raw.item ?? "").trim();
  if (!description) throw new Error(`Item ${index + 1} needs a "description".`);
  const quantity = toNumber(raw.quantity ?? raw.qty ?? 1, `Item ${index + 1} quantity`);
  const unitPrice = toNumber(raw.unitPrice ?? raw.price ?? raw.rate, `Item ${index + 1} unit price`);
  if (quantity < 0 || unitPrice < 0) throw new Error(`Item ${index + 1} cannot have a negative quantity or price.`);
  return { description, quantity, unitPrice };
}

/** Validates invoice JSON (see the tool's example for the shape). */
export function parseInvoiceJson(text: string): Invoice {
  let data: Record<string, unknown>;
  try { data = JSON.parse(text) as Record<string, unknown>; } catch { throw new Error("This is not valid JSON. Check for missing commas or quotes."); }
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("The JSON must be one object describing the invoice.");
  if (!Array.isArray(data.items) || !data.items.length) throw new Error("Add an \"items\" list with at least one line item.");
  const taxRate = toNumber(data.taxRate ?? 0, "taxRate");
  if (taxRate < 0 || taxRate > 100) throw new Error("taxRate is a percentage from 0 to 100.");
  return {
    invoiceNumber: String(data.invoiceNumber ?? data.number ?? "").trim() || "1",
    date: String(data.date ?? "").trim(), dueDate: data.dueDate ? String(data.dueDate) : undefined,
    currency: checkCurrency(String(data.currency ?? "USD")),
    from: party(data.from, "from"), to: party(data.to, "to"),
    items: data.items.map(item), taxRate, discount: Math.max(0, toNumber(data.discount ?? 0, "discount")),
    notes: data.notes ? String(data.notes) : undefined,
  };
}

/** CSV with a header row containing description, quantity and price (or unit price / rate) columns. */
export function parseInvoiceItemsCsv(text: string): InvoiceItem[] {
  const [head, ...rows] = parseCsv(text);
  const find = (...names: string[]) => head.findIndex(h => names.includes(h.trim().toLowerCase().replace(/[\s_-]+/g, "")));
  const columns = { description: find("description", "item", "name", "product", "service"), quantity: find("quantity", "qty", "hours", "units"), price: find("unitprice", "price", "rate", "amount") };
  if (columns.description < 0 || columns.price < 0) throw new Error("The first row must name the columns, including description and price (quantity is optional).");
  if (!rows.length) throw new Error("Add at least one line item below the header row.");
  return rows.map((row, index) => item({ description: row[columns.description], quantity: columns.quantity >= 0 ? row[columns.quantity] || 1 : 1, unitPrice: row[columns.price] }, index));
}

/** Labels are separated by one or more blank lines. */
export function parseLabels(text: string): string[][] {
  const labels = text.replace(/\r\n?/g, "\n").split(/\n\s*\n/).map(block => block.split("\n").map(line => line.trim()).filter(Boolean)).filter(lines => lines.length);
  if (!labels.length) throw new Error("Type at least one label. Separate labels with an empty line.");
  return labels;
}

/** Greedy word wrap using a width function; very long words are broken by character. */
export function wrapText(text: string, width: (s: string) => number, maxWidth: number): string[] {
  const out: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const token of paragraph.split(/(\s+)/).filter(Boolean)) {
      if (/^\s+$/.test(token) || width(line + token) <= maxWidth) { line += token; continue; }
      if (line.trim()) { out.push(line.trimEnd()); line = ""; }
      if (width(token) <= maxWidth) { line = token; continue; }
      for (const char of token) {
        if (line && width(line + char) > maxWidth) { out.push(line); line = ""; }
        line += char;
      }
    }
    out.push(line.trimEnd());
  }
  return out;
}

/** Reads the EXIF orientation tag (1–8) from JPEG bytes; 1 when missing. */
export function jpegOrientation(bytes: Uint8Array): number {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return 1;
  let offset = 2;
  while (offset + 4 < bytes.length) {
    if (bytes[offset] !== 0xff) return 1;
    const marker = bytes[offset + 1];
    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (marker === 0xe1 && String.fromCharCode(...bytes.subarray(offset + 4, offset + 8)) === "Exif") return exifOrientation(bytes, offset + 10);
    if (marker === 0xda) return 1;
    offset += 2 + length;
  }
  return 1;
}

function exifOrientation(bytes: Uint8Array, tiff: number): number {
  const little = bytes[tiff] === 0x49;
  const u16 = (at: number) => (little ? bytes[at] | (bytes[at + 1] << 8) : (bytes[at] << 8) | bytes[at + 1]);
  const u32 = (at: number) => (little ? (u16(at) | (u16(at + 2) << 16)) >>> 0 : ((u16(at) << 16) | u16(at + 2)) >>> 0);
  const ifd = tiff + u32(tiff + 4);
  const count = u16(ifd);
  for (let i = 0; i < count; i += 1) {
    const entry = ifd + 2 + i * 12;
    if (entry + 10 > bytes.length) return 1;
    if (u16(entry) === 0x0112) {
      const value = u16(entry + 8);
      return value >= 1 && value <= 8 ? value : 1;
    }
  }
  return 1;
}
