import type { OptionField, OptionValues } from "@/lib/ops/types";

export function defaultOptions(fields: OptionField[] = []): OptionValues {
  return Object.fromEntries(fields.map(field => [field.id, field.default]));
}

export function OptionFields({ fields, values, onChange, idPrefix }: { fields: OptionField[]; values: OptionValues; onChange: (next: OptionValues) => void; idPrefix: string }) {
  if (!fields.length) return null;
  const set = (id: string, value: string | number | boolean) => onChange({ ...values, [id]: value });
  return <div className="form-grid engine-options">{fields.map(field => {
    const id = `${idPrefix}-${field.id}`;
    const hint = field.hint ? <span className="hint">{field.hint}</span> : null;
    if (field.type === "checkbox") return <label key={field.id} className="field checkbox-field" htmlFor={id}><input id={id} type="checkbox" checked={Boolean(values[field.id])} onChange={e => set(field.id, e.target.checked)}/> {field.label}{hint}</label>;
    if (field.type === "select") return <label key={field.id} className="field" htmlFor={id}>{field.label}<select id={id} value={String(values[field.id])} onChange={e => set(field.id, e.target.value)}>{field.choices.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>{hint}</label>;
    if (field.type === "range") return <label key={field.id} className="field" htmlFor={id}>{field.label}: <strong>{String(values[field.id])}</strong><input id={id} type="range" min={field.min} max={field.max} step={field.step ?? 1} value={Number(values[field.id])} onChange={e => set(field.id, Number(e.target.value))}/>{hint}</label>;
    if (field.type === "number") return <label key={field.id} className="field" htmlFor={id}>{field.label}<input id={id} type="number" min={field.min} max={field.max} step={field.step ?? "any"} value={String(values[field.id])} onChange={e => set(field.id, e.target.value === "" ? "" : Number(e.target.value))}/>{hint}</label>;
    if (field.type === "color") return <label key={field.id} className="field" htmlFor={id}>{field.label}<input id={id} type="color" value={String(values[field.id])} onChange={e => set(field.id, e.target.value)}/>{hint}</label>;
    return <label key={field.id} className="field" htmlFor={id}>{field.label}<input id={id} type="text" placeholder={field.placeholder} value={String(values[field.id])} onChange={e => set(field.id, e.target.value)}/>{hint}</label>;
  })}</div>;
}
