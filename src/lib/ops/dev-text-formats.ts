// JSON ⇄ YAML (emit only), TOML (emit only), JSON Lines, .env, .properties, INI and flatten/unflatten.
import { has, isObject, setOwn, type Json, type JsonObject } from "./dev-text-util.ts";

/* ---------- YAML 1.2 emitter ---------- */
const YAML_RESERVED = /^(true|false|null|yes|no|on|off|y|n|~)$/i;
const YAML_PLAIN = /^[A-Za-z_/.][\w ./@()-]*$/;
function yamlString(text: string): string {
  const plain = YAML_PLAIN.test(text) && !YAML_RESERVED.test(text) && !/\s$/.test(text) && !/^[-.]\d/.test(text);
  return plain ? text : JSON.stringify(text);
}
function yamlScalar(value: Json): string {
  if (value === null) return "null";
  if (typeof value === "string") return yamlString(value);
  if (Array.isArray(value)) return "[]";
  if (typeof value === "object") return "{}";
  return String(value);
}
const isContainer = (v: Json) => (Array.isArray(v) ? v.length > 0 : isObject(v) && Object.keys(v).length > 0);

function yamlLines(value: Json): string[] {
  if (Array.isArray(value) && value.length) {
    return value.flatMap(item => {
      if (!isContainer(item)) return [`- ${yamlScalar(item)}`];
      const [first, ...rest] = yamlLines(item);
      return [`- ${first}`, ...rest.map(line => `  ${line}`)];
    });
  }
  if (isObject(value) && Object.keys(value).length) {
    return Object.entries(value).flatMap(([key, child]) => {
      const k = yamlString(key);
      if (!isContainer(child)) return [`${k}: ${yamlScalar(child)}`];
      return [`${k}:`, ...yamlLines(child).map(line => `  ${line}`)];
    });
  }
  return [yamlScalar(value)];
}

export function toYaml(value: Json, documentMarker: boolean): string {
  return `${documentMarker ? "---\n" : ""}${yamlLines(value).join("\n")}\n`;
}

/* ---------- TOML 1.0 emitter ---------- */
const tomlKey = (key: string) => (/^[A-Za-z0-9_-]+$/.test(key) ? key : JSON.stringify(key));
const tomlString = (text: string) => JSON.stringify(text).replace(/\u007f/g, "\\u007F");
function tomlInline(value: Json, path: string): string {
  if (value === null) throw new Error(`TOML has no null value, so "${path}" cannot be written inside an array. Replace it first.`);
  if (typeof value === "string") return tomlString(value);
  if (typeof value === "number") return Number.isInteger(value) && Math.abs(value) > Number.MAX_SAFE_INTEGER ? value.toExponential() : String(value);
  if (typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `[${value.map((v, i) => tomlInline(v, `${path}[${i}]`)).join(", ")}]`;
  const entries = Object.entries(value).filter(([, v]) => v !== null);
  return entries.length ? `{ ${entries.map(([k, v]) => `${tomlKey(k)} = ${tomlInline(v, `${path}.${k}`)}`).join(", ")} }` : "{}";
}
const isTableArray = (v: Json): v is JsonObject[] => Array.isArray(v) && v.length > 0 && v.every(isObject);

function tomlTable(obj: JsonObject, path: string[]): string[] {
  const lines: string[] = [];
  const nested: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const here = [...path, tomlKey(key)];
    if (value === null) lines.push(`# ${here.join(".")} was null (TOML has no null)`);
    else if (isObject(value)) nested.push("", `[${here.join(".")}]`, ...tomlTable(value, here));
    else if (isTableArray(value)) value.forEach(item => nested.push("", `[[${here.join(".")}]]`, ...tomlTable(item, here)));
    else lines.push(`${tomlKey(key)} = ${tomlInline(value, here.join("."))}`);
  }
  return [...lines, ...nested];
}

export function toToml(value: Json): string {
  if (!isObject(value)) throw new Error("TOML documents are tables: paste a JSON object (not an array or a single value).");
  const lines = tomlTable(value, []);
  while (lines[0] === "") lines.shift();
  return lines.join("\n") + "\n";
}

/* ---------- JSON Lines ---------- */
export function jsonLinesToArray(input: string): Json[] {
  const lines = input.split(/\r?\n/);
  const out: Json[] = [];
  lines.forEach((line, i) => {
    if (!line.trim()) return;
    try { out.push(JSON.parse(line) as Json); } catch { throw new Error(`Line ${i + 1} is not valid JSON.`); }
  });
  if (!out.length) throw new Error("Paste JSON Lines: one JSON value per line.");
  return out;
}

/* ---------- .env ---------- */
export function parseEnv(input: string): Record<string, string> {
  const out: Record<string, string> = {};
  input.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith("#")) return;
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_.-]*)\s*=\s*(.*)$/.exec(line);
    if (!match) throw new Error(`Line ${i + 1} is not a KEY=value pair.`);
    const [, key, rest] = match;
    if (rest.startsWith('"')) {
      const end = /^"((?:[^"\\]|\\.)*)"/.exec(rest);
      if (!end) throw new Error(`Line ${i + 1}: the double-quoted value is not closed. Multi-line values are not supported.`);
      setOwn(out, key, end[1].replace(/\\([nrt"\\$])/g, (_, c: string) => ({ n: "\n", r: "\r", t: "\t" } as Record<string, string>)[c] ?? c));
    } else if (rest.startsWith("'")) {
      const end = rest.indexOf("'", 1);
      if (end < 0) throw new Error(`Line ${i + 1}: the single-quoted value is not closed.`);
      setOwn(out, key, rest.slice(1, end));
    } else setOwn(out, key, rest.replace(/\s+#.*$/, "").trim());
  });
  return out;
}

export function toEnv(value: Json, upper: boolean): string {
  if (!isObject(value)) throw new Error("Paste a JSON object; each key becomes a variable.");
  const flat = flatten(value, "_", false);
  return Object.entries(flat).map(([key, v]) => {
    const name = (upper ? key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toUpperCase() : key).replace(/[^A-Za-z0-9_]/g, "_").replace(/^(\d)/, "_$1");
    const text = v === null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    const safe = /^[\w./:@+-]*$/.test(text);
    return `${name}=${safe ? text : `"${text.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\$/g, "\\$")}"`}`;
  }).join("\n") + "\n";
}

/* ---------- Java .properties ---------- */
function unescapeProperties(text: string): string {
  return text.replace(/\\(u[0-9a-fA-F]{4}|.)/g, (_, c: string) => {
    if (c.length === 5) return String.fromCharCode(parseInt(c.slice(1), 16));
    return ({ t: "\t", n: "\n", r: "\r", f: "\f" } as Record<string, string>)[c] ?? c;
  });
}

export function parseProperties(input: string): Record<string, string> {
  const logical: string[] = [];
  let current = "";
  for (const raw of input.split(/\r?\n/)) {
    const line = raw.replace(/^\s+/, "");
    if (!current && (!line || line.startsWith("#") || line.startsWith("!"))) continue;
    const trailing = /(\\+)$/.exec(line);
    if (trailing && trailing[1].length % 2 === 1) { current += line.slice(0, -1); continue; }
    logical.push(current + line);
    current = "";
  }
  if (current) logical.push(current);
  const out: Record<string, string> = {};
  for (const line of logical) {
    let i = 0;
    while (i < line.length && !/[=:\s]/.test(line[i])) i += line[i] === "\\" ? 2 : 1;
    const key = line.slice(0, i);
    let rest = line.slice(i).replace(/^\s*/, "");
    if (rest.startsWith("=") || rest.startsWith(":")) rest = rest.slice(1).replace(/^\s*/, "");
    setOwn(out, unescapeProperties(key), unescapeProperties(rest));
  }
  return out;
}

function escapeProperties(text: string, isKey: boolean, ascii: boolean): string {
  let out = "";
  for (const [i, ch] of [...text].entries()) {
    const code = ch.codePointAt(0) as number;
    if (ch === "\\") out += "\\\\";
    else if (ch === "\t") out += "\\t";
    else if (ch === "\n") out += "\\n";
    else if (ch === "\r") out += "\\r";
    else if (ch === "\f") out += "\\f";
    else if ("=:#!".includes(ch) && (isKey || i === 0)) out += `\\${ch}`;
    else if (ch === " " && (isKey || i === 0)) out += "\\ ";
    else if (ascii && (code < 0x20 || code > 0x7e)) {
      const units = code > 0xffff ? [0xd800 + ((code - 0x10000) >> 10), 0xdc00 + ((code - 0x10000) & 0x3ff)] : [code];
      out += units.map(u => `\\u${u.toString(16).toUpperCase().padStart(4, "0")}`).join("");
    } else out += ch;
  }
  return out;
}

export function toProperties(value: Json, ascii: boolean): string {
  if (!isObject(value)) throw new Error("Paste a JSON object; nested keys become dotted property names.");
  return Object.entries(flatten(value, ".", false))
    .map(([k, v]) => `${escapeProperties(k, true, ascii)}=${escapeProperties(v === null ? "" : String(v), false, ascii)}`)
    .join("\n") + "\n";
}

/* ---------- INI ---------- */
function iniValue(raw: string, typed: boolean): Json {
  const text = raw.trim();
  const quoted = /^"(.*)"$|^'(.*)'$/.exec(text);
  if (quoted) return quoted[1] ?? quoted[2];
  if (!typed) return text;
  if (/^(true|false)$/i.test(text)) return text.toLowerCase() === "true";
  if (/^-?\d+(\.\d+)?$/.test(text) && Number.isFinite(Number(text))) return Number(text);
  return text;
}

export function parseIni(input: string, typed: boolean): JsonObject {
  const root: JsonObject = {};
  let section: JsonObject = root;
  input.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith(";") || line.startsWith("#")) return;
    const header = /^\[([^\]]+)\]$/.exec(line);
    if (header) {
      section = {};
      setOwn(root, header[1].trim(), section);
      return;
    }
    const pair = /^([^=:]+?)\s*[=:]\s*(.*)$/.exec(line);
    if (!pair) throw new Error(`Line ${i + 1} is not a [section] or a key = value pair.`);
    const [, rawKey, rest] = pair;
    const value = iniValue(rest.replace(/\s+[;#].*$/, ""), typed);
    if (rawKey.endsWith("[]")) {
      const key = rawKey.slice(0, -2);
      const list = has(section, key) && Array.isArray(section[key]) ? (section[key] as Json[]) : [];
      setOwn(section, key, [...list, value]);
    } else setOwn(section, rawKey.trim(), value);
  });
  return root;
}

const iniText = (v: Json) => {
  const text = v === null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
  return /^\s|\s$|[;#"=]/.test(text) ? JSON.stringify(text) : text;
};
function iniPairs(obj: JsonObject): string[] {
  return Object.entries(obj).filter(([, v]) => !isObject(v)).flatMap(([k, v]) => (Array.isArray(v) ? v.map(item => `${k}[] = ${iniText(item)}`) : [`${k} = ${iniText(v)}`]));
}
function iniSections(obj: JsonObject, prefix: string): string[] {
  return Object.entries(obj).filter(([, v]) => isObject(v)).flatMap(([k, v]) => {
    const name = prefix ? `${prefix}.${k}` : k;
    return ["", `[${name}]`, ...iniPairs(v as JsonObject), ...iniSections(v as JsonObject, name)];
  });
}

export function toIni(value: Json): string {
  if (!isObject(value)) throw new Error("Paste a JSON object; nested objects become [sections].");
  const lines = [...iniPairs(value), ...iniSections(value, "")];
  while (lines[0] === "") lines.shift();
  return lines.join("\n") + "\n";
}

/* ---------- flatten / unflatten ---------- */
export function flatten(value: Json, separator: string, brackets: boolean): Record<string, Json> {
  const out: Record<string, Json> = {};
  const walk = (node: Json, path: string) => {
    if (Array.isArray(node) && node.length) node.forEach((item, i) => walk(item, brackets ? `${path}[${i}]` : path ? `${path}${separator}${i}` : String(i)));
    else if (isObject(node) && Object.keys(node).length) Object.entries(node).forEach(([k, v]) => walk(v, path ? `${path}${separator}${k}` : k));
    else setOwn(out, path, node);
  };
  walk(value, "");
  return out;
}

export function unflatten(flat: JsonObject, separator: string): Json {
  const result: JsonObject = {};
  const segmentsOf = (key: string) => key.replace(/\[(\d+)\]/g, `${separator}$1`).split(separator).filter(part => part !== "");
  for (const [key, value] of Object.entries(flat)) {
    const parts = segmentsOf(key);
    if (!parts.length) throw new Error("Empty keys cannot be unflattened.");
    let node: JsonObject = result;
    parts.forEach((part, i) => {
      if (i === parts.length - 1) { setOwn(node, part, value); return; }
      const next = has(node, part) ? node[part] : undefined;
      if (next !== undefined && !isObject(next)) throw new Error(`"${parts.slice(0, i + 1).join(separator)}" is both a value and a parent key.`);
      setOwn(node, part, (next as JsonObject | undefined) ?? {});
      node = node[part] as JsonObject;
    });
  }
  return toArrays(result);
}

function toArrays(value: Json): Json {
  if (!isObject(value)) return value;
  const keys = Object.keys(value);
  const mapped = Object.fromEntries(keys.map(k => [k, toArrays(value[k])]));
  const isList = keys.length > 0 && keys.every((k, i) => k === String(i));
  return isList ? keys.map(k => mapped[k]) : mapped;
}
