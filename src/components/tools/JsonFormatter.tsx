"use client";
import { useState } from "react";
import { formatJson, MAX_TEXT_LENGTH } from "@/lib/native-tools";
import { copyText, downloadText } from "@/lib/native-download";

export default function JsonFormatter() {
  const [source, setSource] = useState("");
  const [output, setOutput] = useState("");
  const [indent, setIndent] = useState("2");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  function run(action: "format" | "minify" | "validate") {
    setError(""); setStatus(""); setOutput("");
    try {
      const value = formatJson(source, action === "minify" ? 0 : indent === "tab" ? "\t" : Number(indent));
      if (action !== "validate") setOutput(value);
      setStatus(action === "validate" ? "Valid JSON. No data was sent to a server." : `${action === "minify" ? "Minified" : "Formatted"} successfully · ${value.length.toLocaleString()} output characters.`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not parse this JSON."); }
  }
  function change(value: string) { setSource(value); setOutput(""); setError(""); setStatus(""); }
  return <div className="tool-panel">
    <div className="toolbar"><div><h2>Make your JSON readable</h2><p className="hint">Format, validate, or remove whitespace. Up to 1 million characters.</p></div><button className="button secondary" onClick={() => change('{"project":"Localtools","private":true,"tools":["format","validate","minify"]}')}>Load example</button></div>
    <div className="form-grid"><div className="field"><label htmlFor="json-source">Input JSON</label><textarea id="json-source" className="code-editor" spellCheck={false} rows={14} value={source} aria-invalid={!!error} aria-describedby="json-help json-error" onChange={event => change(event.target.value)} placeholder={'{"hello": "world"}'}/><p id="json-help" className="hint">Standard JSON only. Comments and trailing commas are invalid. Large integers and duplicate keys can change when parsed by JavaScript.</p></div>
      <div className="field"><label htmlFor="json-output">Output</label><textarea id="json-output" className="code-editor" spellCheck={false} rows={14} value={output} readOnly placeholder="Your formatted JSON appears here."/></div></div>
    <div className="toolbar"><div className="field"><label htmlFor="json-indent">Indentation</label><select id="json-indent" value={indent} onChange={event => { setIndent(event.target.value); setOutput(""); setStatus(""); }}><option value="2">2 spaces</option><option value="4">4 spaces</option><option value="tab">Tabs</option></select></div><button className="button" onClick={() => run("format")} disabled={source.length > MAX_TEXT_LENGTH}>Format JSON</button><button className="button secondary" onClick={() => run("minify")} disabled={source.length > MAX_TEXT_LENGTH}>Minify</button><button className="button secondary" onClick={() => run("validate")}>Validate</button><button className="button secondary" onClick={() => change("")}>Clear</button></div>
    <p id="json-error" className={error || source.length > MAX_TEXT_LENGTH ? "error-message" : "hint"} role={error || source.length > MAX_TEXT_LENGTH ? "alert" : undefined}>{source.length > MAX_TEXT_LENGTH ? "Input exceeds the 1,000,000-character limit. Reduce its size to continue." : error}</p>
    {status && <p className="status-message" role="status">{status}</p>}
    <div className="toolbar"><button className="button secondary" disabled={!output} onClick={async () => { try { await copyText(output); setStatus("Output copied to clipboard."); } catch (reason) { setError(reason instanceof Error ? reason.message : "Copy failed. Select and copy the output manually."); } }}>Copy output</button><button className="button secondary" disabled={!output} onClick={() => downloadText(output, "formatted.json", "application/json")}>Download JSON</button></div>
  </div>;
}
