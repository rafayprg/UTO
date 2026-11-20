import type { OptionField, PdfOp } from "./types";
import {
  MM, PAGE_SIZES, PAGE_SIZE_CHOICES, POSITION_CHOICES, baseName, drawVisualText, fillTemplate, hexToRgb, loadPdf, numberOption, pageRotation,
  pdfFile, positionText, sanitizeFor, saveDoc, visualSize, visualToUserSides, type PdfDoc, type PdfFont, type PdfLib, type PdfPage, type Rgb,
} from "./pdf-ops-common.ts";

const FONT_CHOICES: Array<[string, string]> = [["Helvetica", "Helvetica"], ["Helvetica-Bold", "Helvetica Bold"], ["Times-Roman", "Times"], ["Courier", "Courier"]];
const fontField: OptionField = { id: "font", label: "Font", type: "select", default: "Helvetica", choices: FONT_CHOICES };
const sizeField = (value: number): OptionField => ({ id: "size", label: "Font size (pt)", type: "number", default: value, min: 4, max: 200, step: 1 });
const positionField: OptionField = { id: "position", label: "Position", type: "select", default: "bottom-center", choices: POSITION_CHOICES };
const marginField: OptionField = { id: "margin", label: "Distance from the edge (mm)", type: "number", default: 10, min: 0, max: 100, step: 1 };
const LATIN_NOTE = "Built-in PDF fonts cover Western European characters only; other characters are replaced with \"?\".";

async function embedFont(lib: PdfLib, doc: PdfDoc, name: unknown): Promise<PdfFont> {
  const map: Record<string, string> = { Helvetica: lib.StandardFonts.Helvetica, "Helvetica-Bold": lib.StandardFonts.HelveticaBold, "Times-Roman": lib.StandardFonts.TimesRoman, Courier: lib.StandardFonts.Courier };
  return doc.embedFont(map[String(name)] ?? lib.StandardFonts.Helvetica);
}

interface Stamp { text: string; position: string; size: number; margin: number; font: PdfFont; color: Rgb }

function stampText(lib: PdfLib, page: PdfPage, stamp: Stamp): void {
  if (!stamp.text) return;
  const width = stamp.font.widthOfTextAtSize(stamp.text, stamp.size);
  const point = positionText(stamp.position, width, stamp.size, visualSize(page), stamp.margin);
  drawVisualText(lib, page, { text: stamp.text, x: point.x, y: point.y, size: stamp.size, font: stamp.font, color: stamp.color });
}

async function stampEveryPage(lib: PdfLib, file: File, options: Record<string, unknown>, label: (index: number, total: number) => string, suffix: string) {
  const doc = await loadPdf(lib, file);
  const font = await embedFont(lib, doc, options.font);
  const size = numberOption(options.size, "Font size", 4, 200);
  const margin = numberOption(options.margin, "Distance from the edge", 0, 100) * MM;
  const color = hexToRgb(lib, options.color ?? "#000000");
  const pages = doc.getPages();
  pages.forEach((page, index) => {
    if (options.skipFirst && index === 0) return;
    stampText(lib, page, { text: sanitizeFor(font, label(index, pages.length)), position: String(options.position), size, margin, font, color });
  });
  return [pdfFile(await saveDoc(doc), `${baseName(file)}-${suffix}.pdf`)];
}

function drawWatermark(lib: PdfLib, page: PdfPage, text: string, font: PdfFont, options: Record<string, unknown>): void {
  const size = numberOption(options.size, "Font size", 4, 200);
  const angle = numberOption(options.angle, "Angle", -90, 90);
  const opacity = numberOption(options.opacity, "Opacity", 5, 100) / 100;
  const color = hexToRgb(lib, options.color);
  const width = font.widthOfTextAtSize(text, size);
  const { width: pageW, height: pageH } = visualSize(page);
  const rad = (angle * Math.PI) / 180;
  const centres = options.layout === "tiled"
    ? Array.from({ length: 9 }, (_, i) => ({ cx: pageW * (((i % 3) + 0.5) / 3), cy: pageH * ((Math.floor(i / 3) + 0.5) / 3) }))
    : [{ cx: pageW / 2, cy: pageH / 2 }];
  for (const { cx, cy } of centres) {
    // Start the baseline so the text's centre lands on (cx, cy) after rotation.
    const dx = (width / 2) * Math.cos(rad) - (size * 0.35) * Math.sin(rad);
    const dy = (width / 2) * Math.sin(rad) + (size * 0.35) * Math.cos(rad);
    drawVisualText(lib, page, { text, x: cx - dx, y: cy - dy, size, font, color, opacity, angle });
  }
}

/** Parses "Name=Jane Doe; Agree=yes". A literal semicolon is written as \; */
export function parseFieldValues(text: string): Array<[string, string]> {
  const parts = String(text).replace(/\\;/g, "\u0000").split(";").map(part => part.replace(/\u0000/g, ";").trim()).filter(Boolean);
  if (!parts.length) throw new Error("Enter at least one field, for example: Name=Jane Doe; Agree=yes");
  return parts.map(part => {
    const at = part.indexOf("=");
    if (at < 1) throw new Error(`"${part}" needs the form FieldName=value.`);
    return [part.slice(0, at).trim(), part.slice(at + 1).trim()];
  });
}

const TRUE_WORDS = /^(yes|true|on|x|1|checked)$/i;

function fillField(lib: PdfLib, form: ReturnType<PdfDoc["getForm"]>, name: string, value: string): void {
  const field = form.getFieldMaybe(name);
  if (!field) {
    const names = form.getFields().map(f => f.getName()).slice(0, 20).join(", ");
    throw new Error(`There is no field called "${name}". Fields in this PDF: ${names || "none"}.`);
  }
  if (field instanceof lib.PDFTextField) field.setText(value);
  else if (field instanceof lib.PDFCheckBox) {
    if (TRUE_WORDS.test(value)) field.check();
    else field.uncheck();
  }
  else if (field instanceof lib.PDFDropdown || field instanceof lib.PDFOptionList) field.select(value);
  else if (field instanceof lib.PDFRadioGroup) {
    if (!field.getOptions().includes(value)) throw new Error(`"${value}" is not an option of "${name}". Options: ${field.getOptions().join(", ")}.`);
    field.select(value);
  } else throw new Error(`"${name}" is a button or signature field and cannot be filled with text.`);
}

function resizePage(page: PdfPage, target: [number, number], orientation: string): void {
  const media = page.getMediaBox();
  const rotation = pageRotation(page);
  const turned = rotation === 90 || rotation === 270;
  const visualPortrait = turned ? media.width >= media.height : media.height >= media.width;
  const portrait = orientation === "auto" ? visualPortrait : orientation === "portrait";
  const [visualW, visualH] = portrait ? [Math.min(...target), Math.max(...target)] : [Math.max(...target), Math.min(...target)];
  const [tw, th] = turned ? [visualH, visualW] : [visualW, visualH];
  const scale = Math.min(tw / media.width, th / media.height);
  page.translateContent(-media.x, -media.y);
  page.scaleContent(scale, scale);
  page.translateContent((tw - media.width * scale) / 2, (th - media.height * scale) / 2);
  page.setMediaBox(0, 0, tw, th);
  page.setCropBox(0, 0, tw, th);
}

export const editOps: Record<string, PdfOp> = {
  "text-watermark": {
    input: "pdf",
    options: [
      { id: "text", label: "Watermark text", type: "text", default: "CONFIDENTIAL" },
      { id: "layout", label: "Layout", type: "select", default: "center", choices: [["center", "Once, in the centre"], ["tiled", "Tiled (3 × 3)"]] },
      { id: "angle", label: "Angle (degrees)", type: "number", default: 45, min: -90, max: 90, step: 5 },
      sizeField(60), { id: "opacity", label: "Opacity (%)", type: "range", default: 25, min: 5, max: 100 },
      { id: "color", label: "Colour", type: "color", default: "#d32f2f" }, { ...fontField, default: "Helvetica-Bold" },
    ],
    note: `The watermark is drawn on top of the content. ${LATIN_NOTE}`,
    async process({ files }, options, lib) {
      const doc = await loadPdf(lib, files[0]);
      const font = await embedFont(lib, doc, options.font);
      const text = sanitizeFor(font, String(options.text).trim());
      if (!text) throw new Error("Enter the watermark text.");
      for (const page of doc.getPages()) drawWatermark(lib, page, text, font, options);
      return [pdfFile(await saveDoc(doc), `${baseName(files[0])}-watermarked.pdf`)];
    },
  },
  "page-numbers": {
    input: "pdf",
    options: [
      { id: "format", label: "Format", type: "select", default: "{n}", choices: [["{n}", "1"], ["Page {n}", "Page 1"], ["Page {n} of {total}", "Page 1 of 10"], ["{n} / {total}", "1 / 10"], ["- {n} -", "- 1 -"]] },
      { id: "start", label: "First number", type: "number", default: 1, min: 0, max: 100000, step: 1 },
      positionField, sizeField(11), marginField, fontField, { id: "color", label: "Colour", type: "color", default: "#000000" },
      { id: "skipFirst", label: "Do not number the first page (cover)", type: "checkbox", default: false },
    ],
    async process({ files }, options, lib) {
      const start = numberOption(options.start, "First number", 0, 100000);
      const offset = options.skipFirst ? 1 : 0;
      return stampEveryPage(lib, files[0], options, (index, total) => fillTemplate(String(options.format), index - offset + start, total - offset + start - 1), "numbered");
    },
  },
  "header-footer": {
    input: "pdf",
    options: [
      { id: "header", label: "Header text", type: "text", default: "Quarterly report", hint: "Use {page} and {total} for page numbers." },
      { id: "footer", label: "Footer text", type: "text", default: "Page {page} of {total}" },
      { id: "align", label: "Alignment", type: "select", default: "center", choices: [["center", "Centre"], ["left", "Left"], ["right", "Right"]] },
      sizeField(10), marginField, fontField, { id: "color", label: "Colour", type: "color", default: "#333333" },
    ],
    note: LATIN_NOTE,
    async process({ files }, options, lib) {
      const doc = await loadPdf(lib, files[0]);
      const font = await embedFont(lib, doc, options.font);
      const common = { size: numberOption(options.size, "Font size", 4, 200), margin: numberOption(options.margin, "Distance from the edge", 0, 100) * MM, font, color: hexToRgb(lib, options.color) };
      const total = doc.getPageCount();
      doc.getPages().forEach((page, index) => {
        const fill = (template: unknown) => sanitizeFor(font, fillTemplate(String(template), index + 1, total));
        stampText(lib, page, { ...common, text: fill(options.header), position: `top-${options.align}` });
        stampText(lib, page, { ...common, text: fill(options.footer), position: `bottom-${options.align}` });
      });
      return [pdfFile(await saveDoc(doc), `${baseName(files[0])}-header-footer.pdf`)];
    },
  },
  "bates-numbering": {
    input: "pdf",
    options: [
      { id: "prefix", label: "Prefix", type: "text", default: "ABC" },
      { id: "start", label: "Start number", type: "number", default: 1, min: 0, max: 999999999, step: 1 },
      { id: "digits", label: "Digits (zero padded)", type: "number", default: 6, min: 1, max: 12, step: 1 },
      { ...positionField, default: "bottom-right" }, sizeField(10), marginField, { ...fontField, default: "Courier" }, { id: "color", label: "Colour", type: "color", default: "#000000" },
    ],
    async process({ files }, options, lib) {
      const start = numberOption(options.start, "Start number", 0, 999999999);
      const digits = numberOption(options.digits, "Digits", 1, 12);
      return stampEveryPage(lib, files[0], options, index => `${String(options.prefix)}${String(start + index).padStart(digits, "0")}`, "bates");
    },
  },
  "crop-margins": {
    input: "pdf",
    options: (["top", "right", "bottom", "left"] as const).map(side => ({ id: side, label: `Trim ${side} (mm)`, type: "number" as const, default: 10, min: 0, max: 500, step: 1 })),
    note: "Sets the visible area (crop and media box) of every page. Content outside it is hidden, not deleted.",
    async process({ files }, options, lib) {
      const doc = await loadPdf(lib, files[0]);
      for (const page of doc.getPages()) {
        const trim = visualToUserSides({ top: Number(options.top) * MM, right: Number(options.right) * MM, bottom: Number(options.bottom) * MM, left: Number(options.left) * MM }, pageRotation(page));
        const box = page.getCropBox();
        const width = box.width - trim.left - trim.right;
        const height = box.height - trim.top - trim.bottom;
        if (width < 36 || height < 36) throw new Error("Those margins leave less than 1.3 cm of the page. Use smaller values.");
        page.setMediaBox(box.x + trim.left, box.y + trim.bottom, width, height);
        page.setCropBox(box.x + trim.left, box.y + trim.bottom, width, height);
      }
      return [pdfFile(await saveDoc(doc), `${baseName(files[0])}-cropped.pdf`)];
    },
  },
  "add-margins": {
    input: "pdf",
    options: [{ id: "margin", label: "Margin to add on every side (mm)", type: "number", default: 15, min: 1, max: 200, step: 1 }],
    note: "Enlarges every page so the content gets white space around it (useful before binding or printing).",
    async process({ files }, options, lib) {
      const doc = await loadPdf(lib, files[0]);
      const margin = numberOption(options.margin, "Margin", 1, 200) * MM;
      for (const page of doc.getPages()) {
        const box = page.getCropBox();
        page.setMediaBox(box.x - margin, box.y - margin, box.width + margin * 2, box.height + margin * 2);
        page.setCropBox(box.x - margin, box.y - margin, box.width + margin * 2, box.height + margin * 2);
      }
      return [pdfFile(await saveDoc(doc), `${baseName(files[0])}-margins.pdf`)];
    },
  },
  "resize-pages": {
    input: "pdf",
    options: [
      { id: "paper", label: "New page size", type: "select", default: "a4", choices: PAGE_SIZE_CHOICES },
      { id: "orientation", label: "Orientation", type: "select", default: "auto", choices: [["auto", "Keep each page's orientation"], ["portrait", "Portrait"], ["landscape", "Landscape"]] },
    ],
    note: "Content is scaled to fit and centred. Link areas keep their old position, so clickable links may be offset.",
    async process({ files }, options, lib) {
      const doc = await loadPdf(lib, files[0]);
      for (const page of doc.getPages()) resizePage(page, PAGE_SIZES[String(options.paper)], String(options.orientation));
      return [pdfFile(await saveDoc(doc), `${baseName(files[0])}-${options.paper}.pdf`)];
    },
  },
  "page-border": {
    input: "pdf",
    options: [
      { id: "inset", label: "Distance from the edge (mm)", type: "number", default: 8, min: 0, max: 100, step: 1 },
      { id: "width", label: "Line width (pt)", type: "number", default: 1.5, min: 0.25, max: 20, step: 0.25 },
      { id: "color", label: "Colour", type: "color", default: "#1f2937" },
    ],
    async process({ files }, options, lib) {
      const doc = await loadPdf(lib, files[0]);
      const inset = numberOption(options.inset, "Distance from the edge", 0, 100) * MM;
      const borderWidth = numberOption(options.width, "Line width", 0.25, 20);
      const color = hexToRgb(lib, options.color);
      for (const page of doc.getPages()) {
        const box = page.getCropBox();
        page.drawRectangle({ x: box.x + inset, y: box.y + inset, width: box.width - inset * 2, height: box.height - inset * 2, borderColor: color, borderWidth });
      }
      return [pdfFile(await saveDoc(doc), `${baseName(files[0])}-border.pdf`)];
    },
  },
  "flatten-form": {
    input: "pdf",
    note: "Turns every form field into fixed page content, so values can no longer be edited.",
    async process({ files }, _options, lib) {
      const doc = await loadPdf(lib, files[0]);
      const form = doc.getForm();
      if (!form.getFields().length) throw new Error("This PDF has no form fields to flatten.");
      form.flatten();
      return [pdfFile(await saveDoc(doc), `${baseName(files[0])}-flattened.pdf`)];
    },
  },
  "fill-form": {
    input: "pdf",
    options: [
      { id: "values", label: "Field values", type: "text", default: "Name=Jane Doe; Email=jane@example.com", hint: "FieldName=value, separated by semicolons. Checkboxes take yes or no. Use the PDF Form Field Reader to see field names." },
      { id: "flatten", label: "Flatten after filling (lock the values)", type: "checkbox", default: false },
    ],
    note: "Field values are written with Helvetica, which covers Western European characters.",
    async process({ files }, options, lib) {
      const doc = await loadPdf(lib, files[0]);
      const form = doc.getForm();
      if (!form.getFields().length) throw new Error("This PDF has no form fields.");
      for (const [name, value] of parseFieldValues(String(options.values))) fillField(lib, form, name, value);
      if (options.flatten) form.flatten();
      return [pdfFile(await saveDoc(doc), `${baseName(files[0])}-filled.pdf`)];
    },
  },
  "remove-annotations": {
    input: "pdf",
    options: [{ id: "keepLinks", label: "Keep clickable links", type: "checkbox", default: true }],
    note: "Removes comments, highlights, stamps, and drawings. Form fields are kept; flatten them separately if needed.",
    async process({ files }, options, lib) {
      const doc = await loadPdf(lib, files[0]);
      const keep = new Set(["Widget", ...(options.keepLinks ? ["Link"] : [])]);
      let removed = 0;
      for (const page of doc.getPages()) {
        const annots = page.node.Annots();
        if (!annots) continue;
        const kept = annots.asArray().filter(ref => {
          const dict = doc.context.lookup(ref);
          const subtype = dict instanceof lib.PDFDict ? dict.get(lib.PDFName.of("Subtype")) : undefined;
          return subtype instanceof lib.PDFName && keep.has(subtype.decodeText());
        });
        removed += annots.size() - kept.length;
        page.node.set(lib.PDFName.of("Annots"), doc.context.obj(kept));
      }
      if (!removed) throw new Error("No annotations were found to remove.");
      return [pdfFile(await saveDoc(doc), `${baseName(files[0])}-clean.pdf`)];
    },
  },
  "metadata-editor": {
    input: "pdf",
    options: [
      { id: "title", label: "Title", type: "text", default: "" }, { id: "author", label: "Author", type: "text", default: "" },
      { id: "subject", label: "Subject", type: "text", default: "" }, { id: "keywords", label: "Keywords (comma separated)", type: "text", default: "" },
      { id: "creator", label: "Creator application", type: "text", default: "" },
    ],
    note: "Empty fields keep their current value. The modification date is set to now.",
    async process({ files }, options, lib) {
      const doc = await loadPdf(lib, files[0], { keepMetadata: true });
      const value = (id: string) => String(options[id] ?? "").trim();
      if (!["title", "author", "subject", "keywords", "creator"].some(id => value(id))) throw new Error("Fill in at least one field to change.");
      if (value("title")) doc.setTitle(value("title"));
      if (value("author")) doc.setAuthor(value("author"));
      if (value("subject")) doc.setSubject(value("subject"));
      if (value("keywords")) doc.setKeywords(value("keywords").split(",").map(word => word.trim()).filter(Boolean));
      if (value("creator")) doc.setCreator(value("creator"));
      doc.setModificationDate(new Date());
      return [pdfFile(await saveDoc(doc), `${baseName(files[0])}-metadata.pdf`)];
    },
  },
  "metadata-stripper": {
    input: "pdf",
    note: "Removes the document information (title, author, dates, software) and the XMP metadata stream. Page content is not changed.",
    async process({ files }, _options, lib) {
      const doc = await loadPdf(lib, files[0], { keepMetadata: true });
      stripMetadata(lib, doc);
      return [pdfFile(await saveDoc(doc), `${baseName(files[0])}-no-metadata.pdf`)];
    },
  },
};

export function stripMetadata(lib: PdfLib, doc: PdfDoc): void {
  const info = doc.context.trailerInfo.Info ? doc.context.lookup(doc.context.trailerInfo.Info) : undefined;
  if (info instanceof lib.PDFDict) for (const key of info.keys()) info.delete(key);
  doc.catalog.delete(lib.PDFName.of("Metadata"));
  for (const page of doc.getPages()) page.node.delete(lib.PDFName.of("Metadata"));
}
