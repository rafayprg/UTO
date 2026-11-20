"use client";
import { useMemo, useState } from "react";
import type { ToolDefinition } from "@/lib/tools-registry";
import type { CalcOp, CalcOutput } from "@/lib/ops/types";
import { calcModules } from "@/lib/ops/load";
import { copyText } from "@/lib/native-download";
import { useOp, errorText } from "./useOp";

function CalcWorkspace({ op, tool }: { op: CalcOp; tool: ToolDefinition }) {
  const initial = () => Object.fromEntries(op.fields.map(field => [field.id, field.default]));
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [notice, setNotice] = useState("");
  const outcome = useMemo((): { output?: CalcOutput; error?: string } => {
    try { return { output: op.compute(values) }; } catch (cause) { return { error: errorText(cause) }; }
  }, [op, values]);
  const set = (id: string, value: string) => { setValues(current => ({ ...current, [id]: value })); setNotice(""); };
  const summary = outcome.output?.results.map(result => `${result.label}: ${result.value}`).join("\n") ?? "";
  return <div className="tool-panel calc-engine">
    <div className="form-grid">{op.fields.map(field => {
      const id = `${tool.slug}-${field.id}`;
      return <label key={field.id} className="field" htmlFor={id}>{field.label}
        {field.type === "select"
          ? <select id={id} value={values[field.id]} onChange={e => set(field.id, e.target.value)}>{field.choices?.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          : <input id={id} type={field.type} inputMode={field.type === "number" ? "decimal" : undefined} step={field.type === "number" ? field.step ?? "any" : undefined} value={values[field.id]} onChange={e => set(field.id, e.target.value)}/>}
        {field.hint && <span className="hint">{field.hint}</span>}
      </label>;
    })}</div>
    {outcome.error ? <p className="error-message" role="alert">{outcome.error}</p> : outcome.output && <div className="result-panel" aria-live="polite">
      <div className="stats-grid">{outcome.output.results.map(result => <div key={result.label} className={`stat ${result.primary ? "primary-stat" : ""}`}><strong>{result.value}</strong><span>{result.label}</span></div>)}</div>
      {outcome.output.formula && <code>{outcome.output.formula}</code>}
      {outcome.output.table && <div className="table-scroll"><table><thead><tr>{outcome.output.table.head.map(cell => <th key={cell} scope="col">{cell}</th>)}</tr></thead><tbody>{outcome.output.table.rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>}
    </div>}
    <div className="toolbar">
      <button type="button" className="button secondary" disabled={!summary} onClick={async () => { try { await copyText(summary); setNotice("Results copied."); } catch (cause) { setNotice(errorText(cause)); } }}>Copy results</button>
      <button type="button" className="button secondary" onClick={() => setValues(initial())}>Reset</button>
    </div>
    {notice && <p className="status-message" role="status">{notice}</p>}
    {op.note && <p className="hint">{op.note}</p>}
  </div>;
}

export default function CalcEngine({ preset, tool }: { preset?: ToolDefinition["preset"]; tool: ToolDefinition }) {
  const { op, error } = useOp<CalcOp, { ops: Record<string, CalcOp> }>(calcModules, preset?.module, preset?.op);
  if (error) return <p className="error-message" role="alert">{error}</p>;
  if (!op) return <p className="status-message" role="status">Opening the calculator…</p>;
  return <CalcWorkspace op={op} tool={tool}/>;
}
