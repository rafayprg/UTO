"use client";
import { useEffect, useRef, useState } from "react";
import { FileDropzone } from "./FileDropzone";
import { MB, downloadBlob, fileError, runFileWorker, sizeLabel } from "@/lib/file-browser";
type Source = { id: string; name: string; data: ArrayBuffer };
type Page = { id: string; sourceId: string; page: number };
export default function PdfMerger() {
  const [sources, setSources] = useState<Source[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [original, setOriginal] = useState<Page[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Add PDFs to begin. No files leave your device.");
  const [error, setError] = useState("");
  const [dragged, setDragged] = useState<string | null>(null);
  const worker = useRef<Worker | null>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; worker.current?.terminate(); }; }, []);
  async function add(files: File[]) {
    if (busy) return;
    setError(""); setBusy(true);
    try {
      if (sources.length + files.length > 25 || sources.reduce((sum, file) => sum + file.data.byteLength, 0) + files.reduce((sum, file) => sum + file.size, 0) > 100 * MB) throw new Error("Use at most 25 PDFs and 100 MB combined.");
      const incoming = await Promise.all(files.map(async file => ({ id: crypto.randomUUID(), name: file.name, data: await file.arrayBuffer() })));
      if (!mounted.current) return;
      worker.current = new Worker(new URL("../../workers/pdf.worker.ts", import.meta.url));
      const counts = await runFileWorker<{ id: string; count: number }[]>(worker.current, { action: "inspect", sources: [...sources, ...incoming] }, setMessage);
      if (!mounted.current) return;
      const incomingIds = new Set(incoming.map(source => source.id));
      const added = counts.filter(source => incomingIds.has(source.id)).flatMap(source => Array.from({ length: source.count }, (_, page) => ({ id: crypto.randomUUID(), sourceId: source.id, page })));
      setSources(previous => [...previous, ...incoming]); setPages(previous => [...previous, ...added]); setOriginal(previous => [...previous, ...added]);
      setMessage(`Added ${added.length} pages. Drag pages or use the position controls to reorder.`);
    } catch (cause) { if (mounted.current) setError(fileError(cause)); }
    finally { if (mounted.current) setBusy(false); }
  }
  function move(id: string, target: number) {
    setPages(previous => { const next = [...previous]; const index = next.findIndex(page => page.id === id); if (index < 0) return previous; const [page] = next.splice(index, 1); next.splice(Math.max(0, Math.min(target, next.length)), 0, page); return next; });
    setMessage(`Moved page to position ${target + 1}.`);
  }
  async function merge() {
    setBusy(true); setError("");
    try {
      worker.current = new Worker(new URL("../../workers/pdf.worker.ts", import.meta.url));
      const bytes = await runFileWorker<ArrayBuffer>(worker.current, { action: "merge", sources, pages }, setMessage);
      if (mounted.current) { downloadBlob(new Blob([bytes], { type: "application/pdf" }), "merged.pdf"); setMessage(`Downloaded ${pages.length} pages as merged.pdf.`); }
    } catch (cause) { if (mounted.current) setError(fileError(cause)); }
    finally { if (mounted.current) setBusy(false); }
  }
  return <div className="tool-panel">
    <fieldset disabled={busy} className="tool-fieldset"><legend className="sr-only">PDF files</legend><FileDropzone accept=".pdf,application/pdf" multiple maxBytes={50 * MB} onFiles={files => void add(files)} /></fieldset>
    <p className="hint">Up to 25 PDFs, 50 MB per file, 100 MB combined, and 500 pages. Encrypted files are not supported. Page cards identify source pages; open your originals alongside this tool for visual reference.</p>
    <div className="toolbar"><button className="button" disabled={busy || !pages.length} onClick={() => void merge()}>{busy ? "Processing…" : `Merge & download${pages.length ? ` (${pages.length} pages)` : ""}`}</button><button className="button secondary" disabled={busy || !original.length} onClick={() => { setPages([...original]); setMessage("Restored original page order."); }}>Restore all pages</button><button className="button secondary" disabled={busy || !sources.length} onClick={() => { setSources([]); setPages([]); setOriginal([]); setError(""); setMessage("Workspace cleared."); }}>Clear</button></div>
    <p className="status-message" role="status">{message}</p>{error && <p role="alert" className="error-message">{error}</p>}
    {!!sources.length && <p className="hint">{sources.length} source documents · {sizeLabel(sources.reduce((sum, file) => sum + file.data.byteLength, 0))} · {pages.length} output pages</p>}
    <ol className="file-list" aria-label="Output page order">{pages.map((page, index) => <li key={page.id} className="file-row" draggable={!busy} onDragStart={() => setDragged(page.id)} onDragEnd={() => setDragged(null)} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (!busy && dragged) move(dragged, index); setDragged(null); }}>
      <div><strong>{index + 1}. {sources.find(source => source.id === page.sourceId)?.name}</strong><p className="hint">Source page {page.page + 1}</p></div><div className="toolbar"><button className="small-button" aria-label={`Move output page ${index + 1} up`} disabled={busy || index === 0} onClick={() => move(page.id, index - 1)}>↑</button><button className="small-button" aria-label={`Move output page ${index + 1} down`} disabled={busy || index === pages.length - 1} onClick={() => move(page.id, index + 1)}>↓</button><label className="field"><span className="sr-only">Position for source page {page.page + 1} of {sources.find(source => source.id === page.sourceId)?.name}</span><input key={`${page.id}-${index}`} type="number" min={1} max={pages.length} defaultValue={index + 1} disabled={busy} style={{width:"5rem"}} onBlur={event => { const position = Number(event.target.value); if (Number.isInteger(position) && position >= 1 && position <= pages.length) { if (position !== index + 1) move(page.id, position - 1); } else event.target.value = String(index + 1); }} onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); }}/></label><button className="small-button" aria-label={`Remove output page ${index + 1}`} disabled={busy} onClick={() => { setPages(previous => previous.filter(item => item.id !== page.id)); setMessage("Page removed from output. Restore all pages to undo."); }}>Remove</button></div>
    </li>)}</ol>
  </div>;
}
