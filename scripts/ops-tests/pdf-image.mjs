// Correctness tests for the PDF and image suites (pdf-ops*, image-ops*, image-css*).
// PDF ops run end to end in Node with pdf-lib. Image ops need Canvas, so their pure helpers are tested here.
import assert from "node:assert/strict";
import * as pdfLib from "pdf-lib";

const load = name => import(new URL(`../../src/lib/ops/${name}.ts`, import.meta.url));
const { PDFDocument, StandardFonts, degrees } = pdfLib;

const ranges = await load("pdf-ops-ranges");
const parse = await load("pdf-ops-parse");
const common = await load("pdf-ops-common");
const inspect = await load("pdf-ops-inspect");
const edit = await load("pdf-ops-edit");
const { ops: pdfOps } = await load("pdf-ops");

// ---------- page ranges ----------
assert.deepEqual(ranges.parseRanges("1-3, 5", 6), [0, 1, 2, 4]);
assert.deepEqual(ranges.parseRanges("4-end", 6), [3, 4, 5]);
assert.deepEqual(ranges.parseRanges("5-", 6), [4, 5]);
assert.deepEqual(ranges.parseRanges("-2", 6), [0, 1]);
assert.deepEqual(ranges.parseRanges("3-1", 6), [2, 1, 0]);
assert.deepEqual(ranges.parseRangeGroups("1-2;3", 3), [[0, 1], [2]]);
assert.deepEqual(ranges.parsePageSet("3,1,3", 5), [0, 2]);
assert.throws(() => ranges.parseRanges("0", 5), /start at 1/);
assert.throws(() => ranges.parseRanges("9", 5), /does not exist/);
assert.throws(() => ranges.parseRanges("a-b", 5), /not a page range/);
assert.throws(() => ranges.parseRanges(" , ", 5), /at least one page/);
assert.deepEqual(ranges.chunkPages(5, 2), [[0, 1], [2, 3], [4]]);
assert.throws(() => ranges.chunkPages(5, 0), /at least 1/);
assert.deepEqual(ranges.reorderPages("3,1", 4, true), [2, 0, 1, 3]);
assert.deepEqual(ranges.reorderPages("3,1", 4, false), [2, 0]);
assert.throws(() => ranges.reorderPages("1,1", 4, true), /listed twice/);
assert.deepEqual(ranges.bookletPairs(4), [[3, 0], [1, 2]]);
assert.deepEqual(ranges.bookletPairs(6), [[-1, 0], [1, -1], [5, 2], [3, 4]]);
assert.deepEqual(ranges.interleaveOrder(2, 2, true), [[0, 0], [1, 1], [0, 1], [1, 0]]);
assert.deepEqual(ranges.interleaveOrder(3, 1, false), [[0, 0], [1, 0], [0, 1], [0, 2]]);

// ---------- pure parsers ----------
assert.deepEqual(parse.parseCsv('a,b\n"x, y","he said ""hi"""\n'), [["a", "b"], ["x, y", 'he said "hi"']]);
assert.deepEqual(parse.parseCsv("a;b;c\r\n1;2\r\n"), [["a", "b", "c"], ["1", "2", ""]]);
assert.deepEqual(parse.parseCsv("a\tb\n1\t2"), [["a", "b"], ["1", "2"]]);
assert.throws(() => parse.parseCsv('a,"b'), /never closed/);
assert.equal(parse.stripInline("**Bold** and *it* `code` [site](https://x.dev)"), "Bold and it code site (https://x.dev)");
assert.equal(parse.stripInline("snake_case_name stays"), "snake_case_name stays");
const md = parse.parseMarkdown("# Title\n\nSome *text*\nmore\n\n- one\n  - two\n1. first\n> quote\n```\ncode()\n```\n---");
assert.deepEqual(md.map(b => b.kind), ["heading", "paragraph", "item", "item", "item", "quote", "code", "rule"]);
assert.equal(md[1].text, "Some text more");
assert.equal(md[3].depth, 1);
assert.equal(md[4].marker, "1.");
assert.deepEqual(md[6].lines, ["code()"]);
const invoice = parse.parseInvoiceJson(JSON.stringify({ invoiceNumber: "7", currency: "usd", from: { name: "A" }, to: "B", items: [{ description: "Work", quantity: 3, unitPrice: 19.99 }, { description: "Fee", price: "10.005" }], taxRate: 10, discount: 5 }));
const totals = parse.invoiceTotals(invoice);
assert.equal(invoice.currency, "USD");
assert.deepEqual(totals, { lines: [59.97, 10.01], subtotal: 69.98, discount: 5, tax: 6.5, total: 71.48 });
assert.throws(() => parse.parseInvoiceJson("{"), /not valid JSON/);
assert.throws(() => parse.parseInvoiceJson('{"items":[]}'), /at least one line item/);
assert.throws(() => parse.parseInvoiceJson('{"items":[{"description":"x","price":"abc"}],"from":"a","to":"b"}'), /must be a number/);
assert.deepEqual(parse.parseInvoiceItemsCsv("Description,Qty,Unit Price\nDesign,2,50\n"), [{ description: "Design", quantity: 2, unitPrice: 50 }]);
assert.throws(() => parse.parseInvoiceItemsCsv("foo,bar\n1,2"), /description and price/);
assert.deepEqual(parse.parseLabels("A\nB\n\n\nC"), [["A", "B"], ["C"]]);
const width = s => s.length;
assert.deepEqual(parse.wrapText("aaa bbb ccc", width, 7), ["aaa bbb", "ccc"]);
assert.deepEqual(parse.wrapText("abcdefghij", width, 4), ["abcd", "efgh", "ij"]);
assert.deepEqual(parse.wrapText("x\n\ny", width, 4), ["x", "", "y"]);
// JPEG with an EXIF APP1 segment holding Orientation = 6 (big-endian TIFF).
const exif = [0xff, 0xd8, 0xff, 0xe1, 0x00, 0x22, 0x45, 0x78, 0x69, 0x66, 0, 0, 0x4d, 0x4d, 0, 0x2a, 0, 0, 0, 8, 0, 1, 0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, 6, 0, 0, 0, 0, 0, 0, 0xff, 0xd9];
assert.equal(parse.jpegOrientation(Uint8Array.from(exif)), 6);
assert.equal(parse.jpegOrientation(Uint8Array.from([0xff, 0xd8, 0xff, 0xd9])), 1);

// ---------- common helpers ----------
assert.deepEqual(common.visualToUserSides({ top: 1, right: 2, bottom: 3, left: 4 }, 90), { left: 1, right: 3, bottom: 4, top: 2 });
assert.deepEqual(common.visualToUserSides({ top: 1, right: 2, bottom: 3, left: 4 }, 0), { top: 1, right: 2, bottom: 3, left: 4 });
assert.equal(common.fillTemplate("Page {n} of {total}", 2, 9), "Page 2 of 9");
assert.deepEqual(common.positionText("bottom-right", 20, 10, { width: 100, height: 200 }, 5), { x: 75, y: 5 });
assert.equal(inspect.paperName(595.28, 841.89), "A4 portrait");
assert.equal(inspect.paperName(792, 612), "US Letter landscape");
assert.equal(inspect.paperName(500, 500), "Custom");
assert.equal(inspect.csv([["a,b", 'q"'], [1, 2]]), '"a,b","q"""\r\n1,2\r\n');
assert.equal(inspect.scanNames(new TextEncoder().encode("/JavaScript /JS /JSX /OpenAction"))["/JS"], 1);
assert.deepEqual(edit.parseFieldValues("Name=Jane; Note=a\\;b"), [["Name", "Jane"], ["Note", "a;b"]]);
assert.throws(() => edit.parseFieldValues("oops"), /FieldName=value/);

// ---------- PDF ops end to end ----------
async function samplePdf(count, decorate) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < count; i += 1) doc.addPage([400 + i, 600]).drawText(`Page ${i + 1}`, { x: 40, y: 500, size: 20, font });
  if (decorate) await decorate(doc);
  return new File([await doc.save()], "sample.pdf", { type: "application/pdf" });
}
const run = (key, files, options = {}, text = "") => {
  const op = pdfOps[key];
  assert.ok(op, `missing pdf op ${key}`);
  const defaults = Object.fromEntries((op.options ?? []).map(f => [f.id, f.default]));
  return op.process({ files, text }, { ...defaults, ...options }, pdfLib);
};
const reopen = async output => PDFDocument.load(await output.blob.arrayBuffer());
const widths = doc => doc.getPages().map(p => Math.round(p.getWidth()));
const asText = async output => new TextDecoder().decode(await output.blob.arrayBuffer());

const five = await samplePdf(5);
assert.deepEqual(widths(await reopen((await run("extract-pages", [five], { pages: "5, 1-2" }))[0])), [404, 400, 401]);
assert.deepEqual(widths(await reopen((await run("delete-pages", [five], { pages: "2-4" }))[0])), [400, 404]);
await assert.rejects(run("delete-pages", [five], { pages: "1-end" }), /every page/);
assert.deepEqual(widths(await reopen((await run("reverse-pages", [five]))[0])), [404, 403, 402, 401, 400]);
assert.deepEqual(widths(await reopen((await run("odd-even-pages", [five], { which: "even" }))[0])), [401, 403]);
assert.deepEqual(widths(await reopen((await run("reorder-pages", [five], { pages: "5,4" }))[0])), [404, 403, 400, 401, 402]);
assert.deepEqual(widths(await reopen((await run("duplicate-pages", [five], { pages: "2", copies: 2 }))[0])), [400, 401, 401, 401, 402, 403, 404]);
const split = await run("split-by-range", [five], { pages: "1-2, 3-end" });
assert.equal(split.length, 2);
assert.deepEqual(widths(await reopen(split[1])), [402, 403, 404]);
assert.equal((await run("split-every-n", [five], { size: 2 })).length, 3);
assert.equal((await run("split-single-pages", [five])).length, 5);
const blank = await reopen((await run("insert-blank-page", [five], { after: 0, count: 2 }))[0]);
assert.equal(blank.getPageCount(), 7);
assert.deepEqual(widths(blank).slice(0, 3), [400, 400, 400]);
const rotated = await reopen((await run("rotate-selected", [five], { pages: "2", angle: "270" }))[0]);
assert.deepEqual(rotated.getPages().map(p => p.getRotation().angle), [0, 270, 0, 0, 0]);
const three = await samplePdf(3);
const mixed = await reopen((await run("interleave-pages", [five, three], { reverseB: false }))[0]);
assert.deepEqual(widths(mixed), [400, 400, 401, 401, 402, 402, 403, 404]);
await assert.rejects(run("interleave-pages", [five]), /exactly two/);
assert.deepEqual(widths(await reopen((await run("insert-pdf", [three, five], { after: 1 }))[0])), [400, 400, 401, 402, 403, 404, 401, 402]);
assert.equal((await reopen((await run("n-up", [five], { per: "4" }))[0])).getPageCount(), 2);
assert.equal((await reopen((await run("booklet", [five]))[0])).getPageCount(), 4);
await assert.rejects(run("extract-pages", [five], { pages: "9" }), /does not exist/);

const a4 = await reopen((await run("resize-pages", [five], { paper: "a4" }))[0]);
assert.deepEqual(a4.getPages().map(p => [Math.round(p.getWidth()), Math.round(p.getHeight())])[0], [595, 842]);
const cropped = await reopen((await run("crop-margins", [five], { top: 10, right: 0, bottom: 0, left: 10 }))[0]);
assert.equal(Math.round(cropped.getPage(0).getCropBox().width), Math.round(400 - 10 * common.MM));
const margins = await reopen((await run("add-margins", [five], { margin: 10 }))[0]);
assert.equal(Math.round(margins.getPage(0).getWidth()), Math.round(400 + 20 * common.MM));
for (const key of ["text-watermark", "page-numbers", "header-footer", "bates-numbering", "page-border"]) assert.equal((await reopen((await run(key, [five]))[0])).getPageCount(), 5, key);
await assert.rejects(run("text-watermark", [five], { text: "  " }), /watermark text/);

const meta = await samplePdf(1, async doc => { doc.setTitle("Secret plan"); doc.setAuthor("Ann"); });
const metaReport = await asText((await run("metadata-viewer", [meta]))[0]);
assert.match(metaReport, /Title\s+Secret plan/);
assert.match(metaReport, /Pages\s+1/);
const edited = await PDFDocument.load(await (await run("metadata-editor", [meta], { title: "New title" }))[0].blob.arrayBuffer(), { updateMetadata: false });
assert.equal(edited.getTitle(), "New title");
assert.equal(edited.getAuthor(), "Ann");
await assert.rejects(run("metadata-editor", [meta]), /at least one field/);
const stripped = await PDFDocument.load(await (await run("metadata-stripper", [meta]))[0].blob.arrayBuffer(), { updateMetadata: false });
assert.equal(stripped.getTitle(), undefined);
assert.equal(stripped.getAuthor(), undefined);
assert.match(await asText((await run("page-count", [five, three]))[0]), /8 {2}total pages in 2 files/);
assert.match(await asText((await run("page-size-inspector", [three]))[0]), /^Page,Size \(pt\)/);
assert.match(await asText((await run("version-checker", [three]))[0]), /Header version\s+PDF 1\.7/);
assert.match(await asText((await run("safety-inspector", [three]))[0]), /No active content/);
assert.match(await asText((await run("font-inspector", [three]))[0]), /Helvetica,Type1,Not embedded,1 2 3/);
await assert.rejects(run("bookmark-extractor", [three]), /no bookmarks/);
await assert.rejects(run("link-extractor", [three]), /No clickable/);
await assert.rejects(run("flatten-form", [three]), /no form fields/);
await assert.rejects(run("image-extractor", [three]), /No images/);
await assert.rejects(run("attachment-extractor", [three]), /no attached files/);

const withForm = await samplePdf(1, async doc => {
  const form = doc.getForm();
  form.createTextField("Name").addToPage(doc.getPage(0), { x: 40, y: 400, width: 200, height: 20 });
  form.createCheckBox("Agree").addToPage(doc.getPage(0), { x: 40, y: 360, width: 15, height: 15 });
  await doc.attach(new TextEncoder().encode("hello attachment"), "notes.txt", { mimeType: "text/plain" });
  const link = doc.context.obj({ Type: "Annot", Subtype: "Link", Rect: [0, 0, 50, 50], A: { S: "URI", URI: pdfLib.PDFString.of("https://example.com/a") } });
  const note = doc.context.obj({ Type: "Annot", Subtype: "Text", Rect: [60, 0, 80, 20], Contents: pdfLib.PDFString.of("Check this") });
  const annots = doc.getPage(0).node.Annots();
  annots.push(doc.context.register(link));
  annots.push(doc.context.register(note));
});
const filled = await (await run("fill-form", [withForm], { values: "Name=Jane Doe; Agree=yes" }))[0].blob.arrayBuffer();
const filledForm = (await PDFDocument.load(filled)).getForm();
assert.equal(filledForm.getTextField("Name").getText(), "Jane Doe");
assert.equal(filledForm.getCheckBox("Agree").isChecked(), true);
await assert.rejects(run("fill-form", [withForm], { values: "Nope=1" }), /no field called "Nope".*Name, Agree/);
assert.match(await asText((await run("form-field-reader", [new File([filled], "f.pdf")]))[0]), /Name,Text,Jane Doe/);
assert.equal((await reopen((await run("flatten-form", [withForm]))[0])).getForm().getFields().length, 0);
assert.match(await asText((await run("link-extractor", [withForm]))[0]), /1,https:\/\/example\.com\/a/);
assert.match(await asText((await run("annotation-extractor", [withForm]))[0]), /1,Text,Check this/);
const attached = await run("attachment-extractor", [withForm]);
assert.equal(attached[0].name, "notes.txt");
assert.equal(await asText(attached[0]), "hello attachment");
const cleaned = await reopen((await run("remove-annotations", [withForm], { keepLinks: true }))[0]);
assert.equal(cleaned.getPage(0).node.Annots().size(), 3);
assert.match(await asText((await run("safety-inspector", [withForm]))[0]), /\/EmbeddedFile/);

// Creation tools
const textPdf = await reopen((await run("text-to-pdf", [], {}, "Hello café ✓\n".repeat(200)))[0]);
assert.ok(textPdf.getPageCount() >= 3);
assert.equal((await reopen((await run("markdown-to-pdf", [], {}, "# Hi\n\nText\n\n- a\n- b"))[0])).getPageCount(), 1);
assert.equal((await reopen((await run("code-to-pdf", [], {}, "const a = 1;\n\tif (a) {}\n"))[0])).getPageCount(), 1);
assert.equal((await reopen((await run("csv-to-pdf", [], {}, "a,b\n" + "1,2\n".repeat(300)))[0])).getPageCount() > 1, true);
const invoicePdf = await run("json-invoice-to-pdf", [], {}, JSON.stringify({ invoiceNumber: "A/1", currency: "EUR", from: "Me", to: "You", items: [{ description: "Thing", quantity: 1, unitPrice: 5 }] }));
assert.equal(invoicePdf[0].name, "invoice-A_1.pdf");
await assert.rejects(run("json-invoice-to-pdf", [], {}, '{"currency":"XX","items":[{"description":"a","price":1}],"from":"a","to":"b"}'), /3-letter/);
assert.equal((await reopen((await run("csv-invoice-to-pdf", [], {}, "description,qty,price\nA,1,2\n"))[0])).getPageCount(), 1);
assert.equal((await reopen((await run("address-labels", [], {}, Array.from({ length: 31 }, (_, i) => `Name ${i}\nStreet`).join("\n\n")))[0])).getPageCount(), 2);
assert.equal((await reopen((await run("qr-codes-to-pdf", [], {}, "https://example.com\nhello"))[0])).getPageCount(), 1);
const png = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64"));
const pngFile = new File([png], "dot.png", { type: "image/png" });
const imagePdf = await reopen((await run("png-to-pdf", [pngFile, pngFile]))[0]);
assert.equal(imagePdf.getPageCount(), 2);
await assert.rejects(run("jpg-to-pdf", [pngFile]), /not a JPG/);

// rotation-aware text placement maps into the page box
const turned = await PDFDocument.create();
const turnedPage = turned.addPage([200, 100]);
turnedPage.setRotation(degrees(90));
assert.deepEqual(common.visualSize(turnedPage), { width: 100, height: 200 });
assert.deepEqual(common.visualToUser(turnedPage, 10, 20), { x: 180, y: 10, turn: 90 });

