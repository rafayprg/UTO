"use client";
import { useEffect, useRef, useState } from "react";
import { FileDropzone } from "./FileDropzone";
import { MB, downloadBlob, fileError, runFileWorker, sizeLabel } from "@/lib/file-browser";
import { safeDownloadName, uniqueArchiveNames } from "@/lib/file-zip-safety";
type Entry = { name: string };
export default function ZipTool() {
  const [mode, setMode] = useState<"extract" | "create">("extract");
  const [archive, setArchive] = useState<File | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [compression, setCompression] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const worker = useRef<Worker | null>(null); const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; worker.current?.terminate(); }; }, []);
  async function task<T>(payload: unknown): Promise<T> { worker.current = new Worker(new URL("../../workers/zip.worker.ts", import.meta.url)); return runFileWorker<T>(worker.current, payload, setMessage); }
  async function inspect(file: File) {
    if (busy) return; setBusy(true); setError(""); setEntries([]); setArchive(null); setMessage("Inspecting ZIP directory…");
    try { const data = await file.arrayBuffer(); if (!mounted.current) return; const result = await task<Entry[]>({ action: "inspect", data }); if (mounted.current) { setArchive(file); setEntries(result); setMessage(`${result.length} files found in ${file.name}.`); } }
    catch (cause) { if (mounted.current) setError(fileError(cause)); }
    finally { if (mounted.current) setBusy(false); }
  }
  async function extract(name: string) {
    if (!archive || busy) return; setBusy(true); setError(""); setMessage(`Extracting ${name}…`);
    try { const data = await archive.arrayBuffer(); if (!mounted.current) return; const result = await task<ArrayBuffer>({ action: "extract", data, name }); if (mounted.current) { downloadBlob(new Blob([result]), safeDownloadName(name)); setMessage(`Downloaded ${name}.`); } }
    catch (cause) { if (mounted.current) setError(fileError(cause)); }
    finally { if (mounted.current) setBusy(false); }
  }
  function add(incoming: File[]) { if (busy) return; const next = [...files, ...incoming]; if (next.length > 500 || next.reduce((sum, file) => sum + file.size, 0) > 100 * MB) { setError("Choose at most 500 files and 100 MB total."); return; } setFiles(next); setError(""); setMessage(`${next.length} files selected.`); }
  async function create() {
    setBusy(true); setError(""); setMessage("Reading local files…");
    try { const inputs = await Promise.all(files.map(async file => ({ name: file.name, data: await file.arrayBuffer() }))); if (!mounted.current) return; const result = await task<ArrayBuffer>({ action: "create", files: inputs, compression }); if (mounted.current) { downloadBlob(new Blob([result], { type: "application/zip" }), "archive.zip"); setMessage(`Created archive.zip (${sizeLabel(result.byteLength)}).`); } }
    catch (cause) { if (mounted.current) setError(fileError(cause)); }
    finally { if (mounted.current) setBusy(false); }
  }
  const names = uniqueArchiveNames(files.map(file => file.name));
  return <div className="tool-panel"><div className="segment-control" aria-label="Archive operation"><button aria-pressed={mode === "extract"} disabled={busy} onClick={() => { setMode("extract"); setError(""); setMessage(""); }}>Extract a ZIP</button><button aria-pressed={mode === "create"} disabled={busy} onClick={() => { setMode("create"); setError(""); setMessage(""); }}>Create a ZIP</button></div>
    {mode === "extract" ? <><fieldset disabled={busy} className="tool-fieldset"><legend className="sr-only">ZIP archive</legend><FileDropzone accept=".zip,application/zip,application/x-zip-compressed" maxBytes={50 * MB} onFiles={selected => void inspect(selected[0])}/></fieldset><p className="hint">ZIP only, up to 50 MB. Extracted limits: 25 MB per file, 100 MB total, 500 entries. Encrypted, split, ZIP64, unsafe-path, and suspiciously compressed archives are rejected.</p><ul className="file-list">{entries.map(entry => <li className="file-row" key={entry.name}><span>{entry.name}</span><button className="small-button" disabled={busy} onClick={() => void extract(entry.name)}>Download</button></li>)}</ul>{archive && entries.length === 0 && <p>This archive contains no files.</p>}</> : <><label className="field">Choose files<input type="file" multiple disabled={busy} onChange={event => { add(Array.from(event.target.files || [])); event.target.value = ""; }}/></label><p className="hint">Up to 500 files and 100 MB combined. Duplicate names are numbered automatically. Files are stored at the root of the archive.</p><label className="field"><span><input type="checkbox" checked={compression} disabled={busy} onChange={event => setCompression(event.target.checked)}/> Compress files (DEFLATE)</span></label><ul className="file-list">{files.map((file, index) => <li className="file-row" key={`${names[index]}-${index}`}><div><strong>{names[index]}</strong><p className="hint">{sizeLabel(file.size)}</p></div><button className="small-button" disabled={busy} onClick={() => setFiles(previous => previous.filter((_, item) => item !== index))}>Remove</button></li>)}</ul><div className="toolbar"><button className="button" disabled={busy || !files.length} onClick={() => void create()}>{busy ? "Creating…" : "Create & download ZIP"}</button><button className="button secondary" disabled={busy || !files.length} onClick={() => { setFiles([]); setError(""); setMessage("Files cleared."); }}>Clear files</button></div></>}
    {message && <p className="status-message" role="status">{message}</p>}{error && <p className="error-message" role="alert">{error}</p>}
  </div>;
}
