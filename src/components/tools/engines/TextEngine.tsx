"use client";
import { useEffect, useRef, useState } from "react";
import type { ToolDefinition } from "@/lib/tools-registry";
import type { OptionValues, TextOp } from "@/lib/ops/types";
import { textModules } from "@/lib/ops/load";
import { copyText, downloadText } from "@/lib/native-download";
import { MAX_TEXT_LENGTH } from "@/lib/native-tools";
import { OptionFields, defaultOptions } from "./OptionFields";
import { useOp, errorText } from "./useOp";

const LIVE_DELAY_MS = 150;

function declarations(css: string): string {
  const block = css.match(/\{([^{}]*)\}/);
  return (block ? block[1] : css).trim();
}

function Preview({ kind, output }: { kind: TextOp["preview"]; output: string }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { if (kind === "css" && box.current) box.current.style.cssText = declarations(output); }, [kind, output]);
  if (!kind || !output) return null;
  if (kind === "color") {
    const color = output.split("\n")[0].replace(/^[^:]*:\s*/, "").trim();
    return <div className="engine-preview"><span className="eyebrow">Preview</span><div className="color-swatch" style={{ background: color }} aria-label={`Colour swatch ${color}`}/></div>;
  }
  if (kind === "html-text") return <div className="engine-preview"><span className="eyebrow">Preview</span><div className="preview-text">{output}</div></div>;
  return <div className="engine-preview"><span className="eyebrow">Live preview</span><div className="css-preview-stage"><div ref={box} className="css-preview-box">Aa</div></div></div>;
}

function TextWorkspace({ op, tool }: { op: TextOp; tool: ToolDefinition }) {
  const id = tool.slug;
  const hasInput = op.input !== false && op.input !== undefined;
  const [input, setInput] = useState("");
  const [second, setSecond] = useState("");
  const [options, setOptions] = useState<OptionValues>(() => defaultOptions(op.options));
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const run = useRef(0);
  const file = useRef<HTMLInputElement>(null);

  async function execute() {
    const ticket = ++run.current;
    if (input.length > MAX_TEXT_LENGTH || second.length > MAX_TEXT_LENGTH) { setError("Input exceeds 1,000,000 characters. Reduce it and try again."); return; }
    if (hasInput && !input && !op.manual) { setOutput(""); setError(""); return; }
    setBusy(true);
    try {
      const result = await op.run(input, options, op.second ? second : undefined);
      if (ticket === run.current) { setOutput(result); setError(""); }
    } catch (cause) {
      if (ticket === run.current) { setOutput(""); setError(errorText(cause)); }
    } finally { if (ticket === run.current) setBusy(false); }
  }

  useEffect(() => {
    if (op.manual) return;
    const timer = window.setTimeout(execute, LIVE_DELAY_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, second, options, op]);

  async function loadFile(files: FileList | null) {
    const chosen = files?.[0]; if (!chosen) return;
    if (chosen.size > 5 * 1024 * 1024) { setError("Choose a text file smaller than 5 MB."); return; }
    try { setInput(await chosen.text()); setNotice(`Loaded ${chosen.name}.`); } catch { setError("That file could not be read as text."); }
  }

  const inputSpec = op.input || undefined;
  return <div className="tool-panel text-engine">
    {inputSpec && <div className="field">
      <div className="field-head"><label htmlFor={`${id}-input`}>{inputSpec.label}</label><span className="field-actions">
        <button type="button" className="text-button" onClick={() => { setInput(inputSpec.example); if (op.second) setSecond(op.second.example); }}>Load example</button>
        <button type="button" className="text-button" onClick={() => file.current?.click()}>Open file</button>
        <input ref={file} type="file" className="sr-only" tabIndex={-1} accept={inputSpec.accept ?? ".txt,.csv,.json,.md,.html,.xml,.yaml,.yml,.srt,.vtt,.css,.js,.ts,.sql,text/*"} onChange={e => { loadFile(e.target.files); e.target.value = ""; }}/>
      </span></div>
      <textarea id={`${id}-input`} rows={inputSpec.rows ?? 8} value={input} placeholder={inputSpec.placeholder ?? inputSpec.example} onChange={e => { setInput(e.target.value); setNotice(""); }} spellCheck={false}/>
    </div>}
    {op.second && <div className="field"><label htmlFor={`${id}-second`}>{op.second.label}</label><textarea id={`${id}-second`} rows={inputSpec?.rows ?? 8} value={second} placeholder={op.second.placeholder ?? op.second.example} onChange={e => setSecond(e.target.value)} spellCheck={false}/></div>}
    <OptionFields fields={op.options ?? []} values={options} onChange={setOptions} idPrefix={id}/>
    {(op.manual || !hasInput) && <div className="toolbar"><button type="button" className="button" onClick={execute} disabled={busy || (hasInput && !input)}>{busy ? "Working…" : hasInput ? "Run" : "Generate"}</button></div>}
    {error && <p className="error-message" role="alert">{error}</p>}
    <div className="field"><label htmlFor={`${id}-output`}>{op.outputLabel ?? "Result"}</label><textarea id={`${id}-output`} rows={Math.min(16, Math.max(4, output.split("\n").length + 1))} value={output} readOnly placeholder="The result appears here." spellCheck={false}/></div>
    <Preview kind={op.preview} output={output}/>
    <div className="toolbar">
      <button type="button" className="button secondary" disabled={!output} onClick={async () => { try { await copyText(output); setNotice("Copied to the clipboard."); } catch (cause) { setNotice(errorText(cause)); } }}>Copy result</button>
      <button type="button" className="button secondary" disabled={!output} onClick={() => downloadText(output, `${tool.slug}.${op.outputExt ?? "txt"}`)}>Download</button>
      {inputSpec && <button type="button" className="button secondary" disabled={!input && !second} onClick={() => { setInput(""); setSecond(""); setOutput(""); setError(""); }}>Clear</button>}
    </div>
    {notice && <p className="status-message" role="status">{notice}</p>}
    {op.note && <p className="hint">{op.note}</p>}
  </div>;
}

export default function TextEngine({ preset, tool }: { preset?: ToolDefinition["preset"]; tool: ToolDefinition }) {
  const { op, error } = useOp<TextOp, { ops: Record<string, TextOp> }>(textModules, preset?.module, preset?.op);
  if (error) return <p className="error-message" role="alert">{error}</p>;
  if (!op) return <p className="status-message" role="status">Opening the tool…</p>;
  return <TextWorkspace op={op} tool={tool}/>;
}
