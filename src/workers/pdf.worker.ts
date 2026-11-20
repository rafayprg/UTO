import { PDFDocument } from "pdf-lib";
type PdfSource = { id: string; name: string; data: ArrayBuffer };
type Page = { sourceId: string; page: number };
type Request = { action: "inspect" | "merge"; sources: PdfSource[]; pages?: Page[] };
const scope = globalThis as unknown as { onmessage: (event: MessageEvent<Request>) => void; postMessage: (data: unknown) => void };
scope.onmessage = async ({ data }) => {
  try {
    if (data.sources.length > 25 || data.sources.reduce((sum, source) => sum + source.data.byteLength, 0) > 100 * 1024 * 1024) throw new Error("Use at most 25 PDFs and 100 MB combined.");
    const documents = new Map<string, PDFDocument>();
    const counts: { id: string; count: number }[] = [];
    let total = 0;
    for (const source of data.sources) {
      scope.postMessage({ progress: `Reading ${source.name}…` });
      let document: PDFDocument;
      try { document = await PDFDocument.load(source.data, { updateMetadata: false }); }
      catch { throw new Error(`Could not read ${source.name}. Encrypted or damaged PDFs are not supported.`); }
      total += document.getPageCount();
      if (total > 500) throw new Error("Use at most 500 source pages per session.");
      documents.set(source.id, document); counts.push({ id: source.id, count: document.getPageCount() });
    }
    if (data.action === "inspect") { scope.postMessage({ result: counts }); return; }
    if (!data.pages?.length || data.pages.length > 500) throw new Error("Choose between 1 and 500 output pages.");
    const output = await PDFDocument.create();
    for (let index = 0; index < data.pages.length; index++) {
      const page = data.pages[index]; const document = documents.get(page.sourceId);
      if (!document || !Number.isInteger(page.page) || page.page < 0 || page.page >= document.getPageCount()) throw new Error("A selected page is no longer available.");
      const [copied] = await output.copyPages(document, [page.page]); output.addPage(copied);
      if (index % 20 === 0) scope.postMessage({ progress: `Copying page ${index + 1} of ${data.pages.length}…` });
    }
    const bytes = await output.save();
    scope.postMessage({ result: bytes.buffer });
  } catch (error) { scope.postMessage({ error: error instanceof Error ? error.message : "PDF processing failed." }); }
};
