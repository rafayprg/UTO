import JSZip from "jszip";
import { inspectZipSafety, ZIP_LIMITS, uniqueArchiveNames } from "../lib/file-zip-safety";
type Request = { action: "inspect" | "extract"; data: ArrayBuffer; name?: string } | { action: "create"; files: { name: string; data: ArrayBuffer }[]; compression: boolean };
const scope = globalThis as unknown as { onmessage: (event: MessageEvent<Request>) => void; postMessage: (data: unknown) => void };
scope.onmessage = async ({ data }) => {
  try {
    if (data.action === "create") {
      if (!data.files.length || data.files.length > ZIP_LIMITS.count || data.files.reduce((sum, file) => sum + file.data.byteLength, 0) > ZIP_LIMITS.expanded) throw new Error("Choose 1–500 files totaling no more than 100 MB.");
      const zip = new JSZip(); const names = uniqueArchiveNames(data.files.map(file => file.name));
      data.files.forEach((file, index) => zip.file(names[index], file.data));
      const bytes = await zip.generateAsync({ type: "arraybuffer", compression: data.compression ? "DEFLATE" : "STORE", compressionOptions: { level: 6 } }, metadata => scope.postMessage({ progress: `Creating ZIP: ${Math.round(metadata.percent)}%` }));
      scope.postMessage({ result: bytes }); return;
    }
    inspectZipSafety(data.data);
    const zip = await JSZip.loadAsync(data.data);
    const entries = Object.values(zip.files).filter(entry => !entry.dir);
    if (data.action === "inspect") { scope.postMessage({ result: entries.map(entry => ({ name: entry.name })) }); return; }
    if (!data.name) throw new Error("Choose a file to extract.");
    const entry = zip.file(data.name); if (!entry) throw new Error("This file is no longer in the archive.");
    // Bounded streaming also enforces actual output length, not only the declared ZIP size.
    const result = await new Promise<ArrayBuffer>((resolve, reject) => {
      const chunks: Uint8Array[] = []; let length = 0; let failed = false;
      // JSZip exposes this bounded streaming API at runtime but omits it from
      // JSZipObject's declaration. Keep the adaptation narrow and typed.
      const streamingEntry = entry as typeof entry & { internalStream(type: "uint8array"): JSZip.JSZipStreamHelper<Uint8Array> };
      const stream = streamingEntry.internalStream("uint8array");
      stream.on("data", (chunk: Uint8Array) => {
        if (failed) return;
        length += chunk.length;
        if (length > ZIP_LIMITS.entry) { failed = true; stream.pause(); chunks.length = 0; reject(new Error("This entry expanded beyond the 25 MB limit.")); return; }
        chunks.push(chunk);
      }).on("error", reject).on("end", () => {
        if (failed) return;
        const output = new Uint8Array(length); let offset = 0;
        for (const chunk of chunks) { output.set(chunk, offset); offset += chunk.length; }
        resolve(output.buffer);
      }).resume();
    });
    scope.postMessage({ result });
  } catch (error) { scope.postMessage({ error: error instanceof Error ? error.message : "Archive processing failed." }); }
};
