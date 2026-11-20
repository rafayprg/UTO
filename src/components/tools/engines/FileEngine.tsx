"use client";
import { useEffect, useRef, useState } from "react";
import type { ToolDefinition } from "@/lib/tools-registry";
import type { ImageOp, OptionValues, OutputFile, PdfOp } from "@/lib/ops/types";
import { imageModules, pdfModules } from "@/lib/ops/load";
import { FileDropzone } from "../FileDropzone";
import { downloadBlob, sizeLabel, useFileURL } from "@/lib/file-browser";
import { OptionFields, defaultOptions } from "./OptionFields";
import { useOp, errorText } from "./useOp";

const MAX_FILE_BYTES = 50 * 1024 * 1024;
const MAX_FILES = 25;

function OutputRow({ file }: { file: OutputFile }) {
  const url = useFileURL(file.blob.type.startsWith("image/") ? file.blob : null);
  return <li className="output-row">
    {url && <img src={url} alt={`Preview of ${file.name}`} className="output-thumb"/>}
    <span><strong>{file.name}</strong><small>{sizeLabel(file.blob.size)}</small></span>
    <button type="button" className="button secondary" onClick={() => downloadBlob(file.blob, file.name)}>Download</button>
  </li>;
}

type Runner = { accept: string; multiple: boolean; textInput: boolean; note?: string; options?: ImageOp["options"]; run: (files: File[], text: string, options: OptionValues) => Promise<OutputFile[]> };

function FileWorkspace({ runner, tool }: { runner: Runner; tool: ToolDefinition }) {
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("");
  const [options, setOptions] = useState<OptionValues>(() => defaultOptions(runner.options));
  const [outputs, setOutputs] = useState<OutputFile[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);
  useEffect(() => () => { mounted.current = false; }, []);
  const ready = runner.textInput ? text.trim().length > 0 : files.length > 0;

  async function process() {
    setBusy(true); setError(""); setOutputs([]);
    try {
      const result = await runner.run(files, text, options);
      if (mounted.current) setOutputs(result);
    } catch (cause) {
      if (mounted.current) setError(errorText(cause, "The file could not be processed. Try a smaller or different file."));
    } finally { if (mounted.current) setBusy(false); }
  }

  return <div className="tool-panel file-engine">
    {runner.textInput
      ? <div className="field"><label htmlFor={`${tool.slug}-text`}>Your text</label><textarea id={`${tool.slug}-text`} rows={10} value={text} onChange={e => setText(e.target.value)} placeholder="Type or paste the text for your document…"/></div>
      : <FileDropzone accept={runner.accept} multiple={runner.multiple} maxBytes={MAX_FILE_BYTES} onFiles={chosen => { setFiles(runner.multiple ? [...files, ...chosen].slice(0, MAX_FILES) : chosen); setOutputs([]); setError(""); }}/>}
    {files.length > 0 && <ul className="file-list">{files.map((file, index) => <li key={`${file.name}-${index}`}><span>{file.name} <small>{sizeLabel(file.size)}</small></span><button type="button" className="text-button" onClick={() => setFiles(files.filter((_, i) => i !== index))}>Remove</button></li>)}</ul>}
    <OptionFields fields={runner.options ?? []} values={options} onChange={setOptions} idPrefix={tool.slug}/>
    <div className="toolbar">
      <button type="button" className="button" disabled={!ready || busy} onClick={process}>{busy ? "Working locally…" : "Process"}</button>
      <button type="button" className="button secondary" disabled={busy || (!files.length && !text)} onClick={() => { setFiles([]); setText(""); setOutputs([]); setError(""); }}>Clear</button>
    </div>
    {error && <p className="error-message" role="alert">{error}</p>}
    {outputs.length > 0 && <div className="result-panel" aria-live="polite"><p role="status">{outputs.length === 1 ? "Your file is ready." : `${outputs.length} files are ready.`} Check each result before using it.</p><ul className="output-list">{outputs.map(file => <OutputRow key={file.name} file={file}/>)}</ul></div>}
    {runner.note && <p className="hint">{runner.note}</p>}
  </div>;
}

export function ImageEngine({ preset, tool }: { preset?: ToolDefinition["preset"]; tool: ToolDefinition }) {
  const { op, error } = useOp<ImageOp, { ops: Record<string, ImageOp> }>(imageModules, preset?.module, preset?.op);
  if (error) return <p className="error-message" role="alert">{error}</p>;
  if (!op) return <p className="status-message" role="status">Opening the image tool…</p>;
  const runner: Runner = { accept: op.accept ?? "image/png,image/jpeg,image/webp,image/gif,image/bmp,image/svg+xml,.png,.jpg,.jpeg,.webp,.gif,.bmp,.svg", multiple: Boolean(op.multiple), textInput: false, note: op.note, options: op.options, run: (files, _text, options) => op.process(files, options) };
  return <FileWorkspace runner={runner} tool={tool}/>;
}

export function PdfEngine({ preset, tool }: { preset?: ToolDefinition["preset"]; tool: ToolDefinition }) {
  const { op, error } = useOp<PdfOp, { ops: Record<string, PdfOp> }>(pdfModules, preset?.module, preset?.op);
  if (error) return <p className="error-message" role="alert">{error}</p>;
  if (!op) return <p className="status-message" role="status">Opening the PDF tool…</p>;
  const accept = op.input === "images" ? "image/png,image/jpeg,.png,.jpg,.jpeg" : ".pdf,application/pdf";
  const runner: Runner = {
    accept, multiple: op.input === "pdfs" || op.input === "images", textInput: op.input === "text", note: op.note, options: op.options,
    run: async (files, text, options) => op.process({ files, text }, options, await import("pdf-lib")),
  };
  return <FileWorkspace runner={runner} tool={tool}/>;
}
