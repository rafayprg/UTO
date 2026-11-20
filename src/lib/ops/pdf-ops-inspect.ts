import type { OutputFile, PdfOp } from "./types";
import { baseName, bundle, loadPdf, pageRotation, textFile, type PdfDoc, type PdfLib, type PdfPage } from "./pdf-ops-common.ts";

type PdfDict = Exclude<ReturnType<PdfPage["node"]["Resources"]>, undefined>;
type PdfObject = ReturnType<PdfDict["get"]>;

export function csv(rows: Array<Array<string | number>>): string {
  return rows.map(row => row.map(cell => {
    const text = String(cell);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }).join(",")).join("\r\n") + "\r\n";
}

function text(lib: PdfLib, value: PdfObject): string {
  if (value instanceof lib.PDFString || value instanceof lib.PDFHexString) return value.decodeText();
  if (value instanceof lib.PDFName) return value.decodeText();
  if (value instanceof lib.PDFNumber) return String(value.asNumber());
  if (value instanceof lib.PDFBool) return String(value.asBoolean());
  return "";
}

function dict(lib: PdfLib, doc: PdfDoc, value: PdfObject): PdfDict | undefined {
  const resolved = value instanceof lib.PDFRef ? doc.context.lookup(value) : value;
  return resolved instanceof lib.PDFDict ? resolved : undefined;
}

function field(lib: PdfLib, doc: PdfDoc, from: PdfDict | undefined, key: string): PdfObject {
  if (!from) return undefined;
  const value = from.get(lib.PDFName.of(key));
  return value instanceof lib.PDFRef ? doc.context.lookup(value) : value;
}

/** Common paper sizes, in points, for a friendly name next to the raw size. */
const PAPER: Array<[string, number, number]> = [["A4", 595, 842], ["US Letter", 612, 792], ["US Legal", 612, 1008], ["A3", 842, 1191], ["A5", 420, 595], ["Tabloid", 792, 1224]];
export function paperName(width: number, height: number): string {
  const [short, long] = [Math.min(width, height), Math.max(width, height)];
  const match = PAPER.find(([, w, h]) => Math.abs(w - short) <= 3 && Math.abs(h - long) <= 3);
  if (!match) return "Custom";
  return `${match[0]} ${width > height ? "landscape" : "portrait"}`;
}

const reportName = (file: File, suffix: string, ext = "txt") => `${baseName(file)}-${suffix}.${ext}`;
const fmtDate = (date: Date | undefined) => (date ? date.toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC") : "not set");

/** "%PDF-1.7" header version, or "unknown". */
export function headerVersion(bytes: Uint8Array): string {
  const head = String.fromCharCode(...bytes.subarray(0, 1024));
  return /%PDF-(\d\.\d)/.exec(head)?.[1] ?? "unknown";
}

export const SAFETY_KEYS: Array<[string, string]> = [
  ["/JavaScript", "JavaScript code"], ["/JS", "JavaScript actions"], ["/OpenAction", "An action that runs when the file opens"], ["/AA", "Automatic actions (on page open, field change…)"],
  ["/Launch", "Launch actions (start programs or open files)"], ["/EmbeddedFile", "Embedded files"], ["/SubmitForm", "Form submission to a web address"], ["/URI", "Web links"],
  ["/RichMedia", "Rich media (Flash or video)"], ["/XFA", "XFA forms"], ["/AcroForm", "Interactive form"], ["/Encrypt", "Encryption"], ["/ObjStm", "Compressed object streams (contents not scanned)"],
];

/** Counts PDF name tokens in the raw file, like the classic pdfid triage scan. */
function latin1(bytes: Uint8Array): string {
  let raw = "";
  for (let i = 0; i < bytes.length; i += 32768) raw += String.fromCharCode(...bytes.subarray(i, i + 32768));
  return raw;
}

export function scanNames(bytes: Uint8Array): Record<string, number> {
  const raw = latin1(bytes);
  return Object.fromEntries(SAFETY_KEYS.map(([key]) => [key, (raw.match(new RegExp(`${key.replace("/", "\\/")}(?![A-Za-z0-9])`, "g")) ?? []).length]));
}

function annotations(lib: PdfLib, doc: PdfDoc): Array<{ page: number; annot: PdfDict; subtype: string }> {
  return doc.getPages().flatMap((page, index) => (page.node.Annots()?.asArray() ?? []).flatMap(ref => {
    const annot = dict(lib, doc, ref);
    return annot ? [{ page: index + 1, annot, subtype: text(lib, field(lib, doc, annot, "Subtype")) }] : [];
  }));
}

function outlineLines(lib: PdfLib, doc: PdfDoc): string[] {
  const pageRefs = doc.getPages().map(page => page.ref);
  const outlines = dict(lib, doc, doc.catalog.get(lib.PDFName.of("Outlines")));
  const lines: string[] = [];
  const seen = new Set<PdfDict>();
  const pageOf = (item: PdfDict) => {
    const action = dict(lib, doc, item.get(lib.PDFName.of("A")));
    const dest = field(lib, doc, item, "Dest") ?? field(lib, doc, action, "D");
    if (dest instanceof lib.PDFArray) {
      const index = pageRefs.indexOf(dest.get(0) as (typeof pageRefs)[number]);
      return index >= 0 ? `page ${index + 1}` : "page ?";
    }
    return dest ? `named destination "${text(lib, dest)}"` : action ? text(lib, field(lib, doc, action, "URI")) || "action" : "no target";
  };
  const walk = (first: PdfObject, depth: number) => {
    let item = dict(lib, doc, first);
    while (item && !seen.has(item) && lines.length < 5000) {
      seen.add(item);
      lines.push(`${"  ".repeat(depth)}${text(lib, field(lib, doc, item, "Title")) || "(untitled)"}  …  ${pageOf(item)}`);
      walk(item.get(lib.PDFName.of("First")), depth + 1);
      item = dict(lib, doc, item.get(lib.PDFName.of("Next")));
    }
  };
  if (outlines) walk(outlines.get(lib.PDFName.of("First")), 0);
  return lines;
}

function fontRows(lib: PdfLib, doc: PdfDoc): string[][] {
  const fonts = new Map<string, { type: string; embedded: boolean; pages: Set<number> }>();
  doc.getPages().forEach((page, index) => {
    const resources = page.node.Resources();
    const fontDict = dict(lib, doc, resources?.get(lib.PDFName.of("Font")));
    for (const [, ref] of fontDict?.entries() ?? []) {
      const font = dict(lib, doc, ref);
      if (!font) continue;
      const name = text(lib, field(lib, doc, font, "BaseFont")) || "(unnamed)";
      const type = text(lib, field(lib, doc, font, "Subtype"));
      const descendants = field(lib, doc, font, "DescendantFonts");
      const descendant = descendants instanceof lib.PDFArray ? dict(lib, doc, descendants.get(0)) : undefined;
      const descriptor = dict(lib, doc, (descendant ?? font).get(lib.PDFName.of("FontDescriptor")));
      const embedded = ["FontFile", "FontFile2", "FontFile3"].some(key => descriptor?.has(lib.PDFName.of(key)));
      const key = `${name}|${type}`;
      const entry = fonts.get(key) ?? { type, embedded, pages: new Set<number>() };
      entry.pages.add(index + 1);
      fonts.set(key, entry);
    }
  });
  return [...fonts.entries()].map(([key, info]) => {
    const name = key.split("|")[0];
    const pages = [...info.pages];
    return [name, info.type, info.embedded ? (/^[A-Z]{6}\+/.test(name) ? "Embedded subset" : "Embedded") : "Not embedded", pages.length > 8 ? `${pages.slice(0, 8).join(" ")} … (${pages.length} pages)` : pages.join(" ")];
  });
}

function imageStreams(lib: PdfLib, doc: PdfDoc): { files: Array<{ bytes: Uint8Array; ext: string }>; skipped: number } {
  const found = new Map<PdfObject, { bytes: Uint8Array; ext: string } | null>();
  const visit = (resources: PdfDict | undefined, depth: number) => {
    const xobjects = dict(lib, doc, resources?.get(lib.PDFName.of("XObject")));
    for (const [, ref] of xobjects?.entries() ?? []) {
      const stream = ref instanceof lib.PDFRef ? doc.context.lookup(ref) : ref;
      if (!(stream instanceof lib.PDFRawStream) || found.has(stream)) continue;
      const subtype = text(lib, field(lib, doc, stream.dict, "Subtype"));
      if (subtype === "Form" && depth < 4) { found.set(stream, null); visit(dict(lib, doc, stream.dict.get(lib.PDFName.of("Resources"))), depth + 1); continue; }
      if (subtype !== "Image") continue;
      const filter = field(lib, doc, stream.dict, "Filter");
      const filters = filter instanceof lib.PDFArray ? filter.asArray().map(item => text(lib, item)) : [text(lib, filter)];
      const last = filters[filters.length - 1];
      const ext = filters.length === 1 && last === "DCTDecode" ? "jpg" : filters.length === 1 && last === "JPXDecode" ? "jp2" : "";
      found.set(stream, ext ? { bytes: stream.contents, ext } : { bytes: new Uint8Array(), ext: "" });
    }
  };
  for (const page of doc.getPages()) visit(page.node.Resources(), 0);
  const images = [...found.values()].filter((item): item is { bytes: Uint8Array; ext: string } => item !== null);
  return { files: images.filter(item => item.ext), skipped: images.filter(item => !item.ext).length };
}

function attachments(lib: PdfLib, doc: PdfDoc): Array<{ name: string; bytes: Uint8Array }> {
  const names = dict(lib, doc, doc.catalog.get(lib.PDFName.of("Names")));
  const root = dict(lib, doc, names?.get(lib.PDFName.of("EmbeddedFiles")));
  const out: Array<{ name: string; bytes: Uint8Array }> = [];
  const walk = (node: PdfDict | undefined, depth: number) => {
    if (!node || depth > 10) return;
    const pairs = field(lib, doc, node, "Names");
    if (pairs instanceof lib.PDFArray) {
      for (let i = 0; i + 1 < pairs.size(); i += 2) {
        const spec = dict(lib, doc, pairs.get(i + 1));
        const ef = dict(lib, doc, spec?.get(lib.PDFName.of("EF")));
        const stream = field(lib, doc, ef, "UF") ?? field(lib, doc, ef, "F");
        if (!(stream instanceof lib.PDFRawStream)) continue;
        const name = text(lib, field(lib, doc, spec, "UF")) || text(lib, field(lib, doc, spec, "F")) || text(lib, pairs.get(i)) || `attachment-${out.length + 1}`;
        out.push({ name: name.replace(/[\\/:*?"<>|]/g, "_"), bytes: lib.decodePDFRawStream(stream).decode() });
      }
    }
    const kids = field(lib, doc, node, "Kids");
    if (kids instanceof lib.PDFArray) for (const kid of kids.asArray()) walk(dict(lib, doc, kid), depth + 1);
  };
  walk(root, 0);
  return out;
}

function formRows(lib: PdfLib, doc: PdfDoc): string[][] {
  return doc.getForm().getFields().map(item => {
    let type = "Other";
    let value = "";
    let choices = "";
    if (item instanceof lib.PDFTextField) { type = "Text"; value = item.getText() ?? ""; }
    else if (item instanceof lib.PDFCheckBox) { type = "Checkbox"; value = item.isChecked() ? "yes" : "no"; }
    else if (item instanceof lib.PDFRadioGroup) { type = "Radio group"; value = item.getSelected() ?? ""; choices = item.getOptions().join(" | "); }
    else if (item instanceof lib.PDFDropdown) { type = "Dropdown"; value = item.getSelected().join(" | "); choices = item.getOptions().join(" | "); }
    else if (item instanceof lib.PDFOptionList) { type = "List"; value = item.getSelected().join(" | "); choices = item.getOptions().join(" | "); }
    else if (item instanceof lib.PDFButton) type = "Button";
    else if (item instanceof lib.PDFSignature) type = "Signature";
    return [item.getName(), type, value, choices, item.isRequired() ? "yes" : "no", item.isReadOnly() ? "yes" : "no"];
  });
}

function single(file: File, body: string, suffix: string, ext = "txt"): OutputFile[] {
  return [textFile(body, reportName(file, suffix, ext), ext === "csv" ? "text/csv" : "text/plain")];
}

export const inspectOps: Record<string, PdfOp> = {
  "metadata-viewer": {
    input: "pdf",
    note: "Gives you a plain-text report. Nothing in the PDF is changed.",
    async process({ files }, _options, lib) {
      const doc = await loadPdf(lib, files[0], { keepMetadata: true });
      const bytes = new Uint8Array(await files[0].arrayBuffer());
      const rows: Array<[string, string]> = [
        ["File", files[0].name], ["Title", doc.getTitle() ?? "not set"], ["Author", doc.getAuthor() ?? "not set"], ["Subject", doc.getSubject() ?? "not set"],
        ["Keywords", doc.getKeywords() ?? "not set"], ["Creator", doc.getCreator() ?? "not set"], ["Producer", doc.getProducer() ?? "not set"],
        ["Created", fmtDate(doc.getCreationDate())], ["Modified", fmtDate(doc.getModificationDate())], ["Pages", String(doc.getPageCount())],
        ["PDF version (header)", headerVersion(bytes)], ["XMP metadata stream", doc.catalog.has(lib.PDFName.of("Metadata")) ? "present" : "none"],
        ["Form fields", String(doc.getForm().getFields().length)],
      ];
      return single(files[0], rows.map(([key, value]) => `${key.padEnd(22)} ${value}`).join("\n") + "\n", "metadata");
    },
  },
  "page-count": {
    input: "pdfs",
    note: "Add one or more PDFs to get a page count for each and a total.",
    async process({ files }, _options, lib) {
      if (!files.length) throw new Error("Add at least one PDF.");
      const rows: Array<[string, number]> = [];
      for (const file of files) rows.push([file.name, (await loadPdf(lib, file, { allowEncrypted: true })).getPageCount()]);
      const total = rows.reduce((sum, [, count]) => sum + count, 0);
      const body = [...rows.map(([name, count]) => `${String(count).padStart(6)}  ${name}`), "------", `${String(total).padStart(6)}  total pages in ${rows.length} file${rows.length === 1 ? "" : "s"}`].join("\n");
      return [textFile(`${body}\n`, "page-count.txt")];
    },
  },
  "page-size-inspector": {
    input: "pdf",
    async process({ files }, _options, lib) {
      const doc = await loadPdf(lib, files[0]);
      const rows = doc.getPages().map((page, index) => {
        const box = page.getCropBox();
        const r = (n: number, d = 1) => n.toFixed(d);
        return [index + 1, `${r(box.width)} × ${r(box.height)}`, `${r(box.width / 72, 2)} × ${r(box.height / 72, 2)}`, `${r(box.width / 72 * 25.4)} × ${r(box.height / 72 * 25.4)}`, paperName(box.width, box.height), `${pageRotation(page)}°`];
      });
      return single(files[0], csv([["Page", "Size (pt)", "Size (in)", "Size (mm)", "Paper", "Rotation"], ...rows]), "page-sizes", "csv");
    },
  },
  "link-extractor": {
    input: "pdf",
    note: "Lists every web link stored as a clickable link annotation. Addresses that are only typed in the text are not links and need the text extractor.",
    async process({ files }, _options, lib) {
      const doc = await loadPdf(lib, files[0]);
      const rows = annotations(lib, doc).filter(item => item.subtype === "Link").flatMap(({ page, annot }) => {
        const uri = text(lib, field(lib, doc, dict(lib, doc, annot.get(lib.PDFName.of("A"))), "URI"));
        return uri ? [[page, uri]] : [];
      });
      if (!rows.length) throw new Error("No clickable web links were found in this PDF.");
      return single(files[0], csv([["Page", "URL"], ...rows]), "links", "csv");
    },
  },
  "font-inspector": {
    input: "pdf",
    note: "Reads the fonts each page declares. Fonts used only inside nested graphics may not be listed.",
    async process({ files }, _options, lib) {
      const doc = await loadPdf(lib, files[0]);
      const rows = fontRows(lib, doc);
      if (!rows.length) throw new Error("No fonts were found. The PDF may contain only scanned images.");
      return single(files[0], csv([["Font", "Type", "Embedding", "Pages"], ...rows]), "fonts", "csv");
    },
  },
  "bookmark-extractor": {
    input: "pdf",
    async process({ files }, _options, lib) {
      const doc = await loadPdf(lib, files[0]);
      const lines = outlineLines(lib, doc);
      if (!lines.length) throw new Error("This PDF has no bookmarks (outline).");
      return single(files[0], `${lines.join("\n")}\n`, "bookmarks");
    },
  },
  "form-field-reader": {
    input: "pdf",
    async process({ files }, _options, lib) {
      const doc = await loadPdf(lib, files[0]);
      const rows = formRows(lib, doc);
      if (!rows.length) throw new Error("This PDF has no interactive form fields.");
      return single(files[0], csv([["Field name", "Type", "Value", "Options", "Required", "Read-only"], ...rows]), "form-fields", "csv");
    },
  },
  "annotation-extractor": {
    input: "pdf",
    note: "Exports comments, highlights, notes and other annotations. Highlighted text itself is not included.",
    async process({ files }, _options, lib) {
      const doc = await loadPdf(lib, files[0]);
      const rows = annotations(lib, doc).filter(item => item.subtype !== "Widget").map(({ page, annot, subtype }) => {
        const rect = field(lib, doc, annot, "Rect");
        const box = rect instanceof lib.PDFArray ? rect.asArray().map(n => Math.round(Number(text(lib, n)) || 0)).join(" ") : "";
        return [page, subtype, text(lib, field(lib, doc, annot, "Contents")), text(lib, field(lib, doc, annot, "T")), text(lib, field(lib, doc, annot, "M")), box];
      });
      if (!rows.length) throw new Error("No annotations were found in this PDF.");
      return single(files[0], csv([["Page", "Type", "Text", "Author", "Modified", "Rectangle (x1 y1 x2 y2)"], ...rows]), "annotations", "csv");
    },
  },
  "image-extractor": {
    input: "pdf",
    note: "Saves JPEG and JPEG 2000 images exactly as stored (no quality loss). Other image types are counted but not exported yet.",
    async process({ files }, _options, lib) {
      const doc = await loadPdf(lib, files[0]);
      const { files: images, skipped } = imageStreams(lib, doc);
      if (!images.length) throw new Error(skipped ? `This PDF has ${skipped} image${skipped === 1 ? "" : "s"}, but none are stored as JPEG, which this tool exports.` : "No images were found in this PDF.");
      const out = images.map((image, index) => ({ blob: new Blob([image.bytes as BlobPart], { type: image.ext === "jpg" ? "image/jpeg" : "image/jp2" }), name: `${baseName(files[0])}-image-${String(index + 1).padStart(3, "0")}.${image.ext}` }));
      return bundle(out, `${baseName(files[0])}-images.zip`);
    },
  },
  "attachment-extractor": {
    input: "pdf",
    note: "Exports files attached to the PDF document. Attachments pinned to a page as comment icons are not included.",
    async process({ files }, _options, lib) {
      const doc = await loadPdf(lib, files[0]);
      const found = attachments(lib, doc);
      if (!found.length) throw new Error("This PDF has no attached files.");
      return bundle(found.map(item => ({ blob: new Blob([item.bytes as BlobPart], { type: "application/octet-stream" }), name: item.name })), `${baseName(files[0])}-attachments.zip`);
    },
  },
  "safety-inspector": {
    input: "pdf",
    note: "A quick triage scan of the raw file for risky features. It does not open the PDF's code and is not a virus scanner.",
    async process({ files }) {
      if (!files[0]) throw new Error("Choose a PDF file first.");
      const bytes = new Uint8Array(await files[0].arrayBuffer());
      if (headerVersion(bytes) === "unknown") throw new Error("This file has no PDF header, so it is not a PDF.");
      const counts = scanNames(bytes);
      const risky = ["/JavaScript", "/JS", "/OpenAction", "/AA", "/Launch", "/EmbeddedFile", "/SubmitForm", "/RichMedia"].filter(key => counts[key] > 0);
      const lines = SAFETY_KEYS.map(([key, label]) => `${String(counts[key]).padStart(5)}  ${key.padEnd(14)} ${label}`);
      const verdict = risky.length ? `Review before opening: found ${risky.join(", ")}.` : "No active content markers were found in the readable part of the file.";
      const hidden = counts["/ObjStm"] ? "\nThis file uses compressed object streams, so some objects could not be scanned." : "";
      return single(files[0], `${files[0].name}\n\n${lines.join("\n")}\n\n${verdict}${hidden}\n`, "safety-report");
    },
  },
  "version-checker": {
    input: "pdf",
    async process({ files }, _options, lib) {
      if (!files[0]) throw new Error("Choose a PDF file first.");
      const bytes = new Uint8Array(await files[0].arrayBuffer());
      const header = headerVersion(bytes);
      if (header === "unknown") throw new Error("This file has no PDF header, so it is not a PDF.");
      const doc = await loadPdf(lib, files[0], { allowEncrypted: true, keepMetadata: true });
      const catalogVersion = text(lib, field(lib, doc, doc.catalog, "Version"));
      const raw = latin1(bytes);
      const rows: Array<[string, string]> = [
        ["Header version", `PDF ${header}`], ["Catalog version", catalogVersion ? `PDF ${catalogVersion} (overrides the header)` : "not set"],
        ["Encrypted", doc.isEncrypted ? "yes" : "no"], ["Linearized (fast web view)", raw.slice(0, 2048).includes("/Linearized") ? "yes" : "no"],
        ["End-of-file markers (%%EOF)", `${(raw.match(/%%EOF/g) ?? []).length} (more than 1 usually means the file was edited and saved incrementally)`], ["Pages", String(doc.getPageCount())], ["File size", `${bytes.length.toLocaleString("en-US")} bytes`],
      ];
      return single(files[0], rows.map(([key, value]) => `${key.padEnd(28)} ${value}`).join("\n") + "\n", "version");
    },
  },
};
