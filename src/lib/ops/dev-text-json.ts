// A JSON / JavaScript-object-literal parser (JSON5-style subset), plus JSON tree, paths, diff, merge and sorting.
import { has, isObject, lineColumn, setOwn, type Json, type JsonObject } from "./dev-text-util.ts";

interface ParseResult { value: Json; duplicates: string[] }

/**
 * strict = true: RFC 8259 JSON, but duplicate keys are recorded instead of silently dropped.
 * strict = false: also accepts // and block comments, single-quoted strings, unquoted identifier keys,
 * trailing commas, hex numbers, leading "+" and leading/trailing decimal points.
 */
export function parseLoose(text: string, strict: boolean): ParseResult {
  let pos = 0;
  const duplicates: string[] = [];
  const fail = (message: string): never => {
    const { line, column } = lineColumn(text, pos);
    throw new Error(`${message} at line ${line}, column ${column}.`);
  };
  const space = () => {
    for (;;) {
      while (pos < text.length && /[\s﻿]/.test(text[pos])) pos++;
      if (!strict && text.startsWith("//", pos)) { const end = text.indexOf("\n", pos); pos = end < 0 ? text.length : end; continue; }
      if (!strict && text.startsWith("/*", pos)) { const end = text.indexOf("*/", pos + 2); if (end < 0) fail("Unclosed comment"); pos = end + 2; continue; }
      return;
    }
  };
  const string = (): string => {
    const quote = text[pos];
    if (strict && quote !== '"') fail("Strings must use double quotes");
    pos++;
    let out = "";
    while (pos < text.length && text[pos] !== quote) {
      const ch = text[pos];
      if (ch === "\n" || (strict && ch < " ")) fail("Unescaped control character in string");
      if (ch !== "\\") { out += ch; pos++; continue; }
      const esc = text[pos + 1];
      pos += 2;
      const simple: Record<string, string> = { '"': '"', "\\": "\\", "/": "/", b: "\b", f: "\f", n: "\n", r: "\r", t: "\t" };
      if (esc in simple) out += simple[esc];
      else if (esc === "u" && /^[0-9a-fA-F]{4}$/.test(text.slice(pos, pos + 4))) { out += String.fromCharCode(parseInt(text.slice(pos, pos + 4), 16)); pos += 4; }
      else if (!strict && esc === "'") out += "'";
      else if (!strict && esc === "v") out += "\v";
      else if (!strict && esc === "0" && !/[0-9]/.test(text[pos])) out += "\0";
      else if (!strict && esc === "x" && /^[0-9a-fA-F]{2}$/.test(text.slice(pos, pos + 2))) { out += String.fromCharCode(parseInt(text.slice(pos, pos + 2), 16)); pos += 2; }
      else if (!strict && esc === "\n") { /* line continuation */ }
      else { pos -= 2; fail(`Invalid escape "\\${esc ?? ""}"`); }
    }
    if (pos >= text.length) fail("Unclosed string");
    pos++;
    return out;
  };
  const number = (): number => {
    const rest = text.slice(pos);
    const pattern = strict ? /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/ : /^[+-]?(0[xX][0-9a-fA-F]+|(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?)/;
    const match = pattern.exec(rest);
    if (!match) fail("Invalid number");
    const m = (match as RegExpExecArray)[0];
    pos += m.length;
    const sign = m.startsWith("-") ? -1 : 1;
    const body = m.replace(/^[+-]/, "");
    return /^0[xX]/.test(body) ? sign * parseInt(body.slice(2), 16) : Number(m);
  };
  const key = (): string => {
    if (text[pos] === '"' || (!strict && text[pos] === "'")) return string();
    if (strict) fail("Property names must be double-quoted strings");
    const match = /^[A-Za-z_$][\w$]*/.exec(text.slice(pos));
    if (!match) fail("Expected a property name");
    pos += (match as RegExpExecArray)[0].length;
    return (match as RegExpExecArray)[0];
  };
  const value = (path: string): Json => {
    space();
    const ch = text[pos];
    if (ch === "{") {
      pos++;
      const obj: JsonObject = {};
      space();
      if (text[pos] === "}") { pos++; return obj; }
      for (;;) {
        space();
        if (!strict && text[pos] === "}") { pos++; return obj; }
        const k = key();
        if (has(obj, k)) duplicates.push(`${path}.${k}`);
        space();
        if (text[pos] !== ":") fail('Expected ":" after the property name');
        pos++;
        setOwn(obj, k, value(`${path}.${k}`));
        space();
        if (text[pos] === ",") { pos++; continue; }
        if (text[pos] === "}") { pos++; return obj; }
        fail('Expected "," or "}"');
      }
    }
    if (ch === "[") {
      pos++;
      const arr: Json[] = [];
      space();
      if (text[pos] === "]") { pos++; return arr; }
      for (;;) {
        space();
        if (!strict && text[pos] === "]") { pos++; return arr; }
        arr.push(value(`${path}[${arr.length}]`));
        space();
        if (text[pos] === ",") { pos++; continue; }
        if (text[pos] === "]") { pos++; return arr; }
        fail('Expected "," or "]"');
      }
    }
    if (ch === '"' || (!strict && ch === "'")) return string();
    if (text.startsWith("true", pos)) { pos += 4; return true; }
    if (text.startsWith("false", pos)) { pos += 5; return false; }
    if (text.startsWith("null", pos)) { pos += 4; return null; }
    if (!strict && /^(undefined|NaN|[+-]?Infinity)\b/.test(text.slice(pos))) fail("undefined, NaN and Infinity have no JSON equivalent");
    if (ch === "`") fail("Template literals are not supported");
    if (ch !== undefined && /[-+.\d]/.test(ch)) return number();
    return fail(ch === undefined ? "Unexpected end of input" : `Unexpected character "${ch}"`);
  };
  if (!text.trim()) throw new Error("Paste some JSON first.");
  const result = value("$");
  space();
  if (pos < text.length) fail("Unexpected text after the end of the value");
  return { value: result, duplicates };
}

/* ---------- JSON → JavaScript object literal ---------- */
export function toJsLiteral(value: Json, quote: string, trailing: boolean, unit = "  "): string {
  const str = (s: string) => (quote === "'" ? `'${JSON.stringify(s).slice(1, -1).replace(/\\"/g, '"').replace(/'/g, "\\'")}'` : JSON.stringify(s));
  const keyText = (k: string) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : str(k));
  const walk = (v: Json, depth: number): string => {
    const pad = unit.repeat(depth + 1), end = unit.repeat(depth), comma = trailing ? "," : "";
    if (Array.isArray(v)) return v.length ? `[\n${v.map(item => pad + walk(item, depth + 1)).join(",\n")}${comma}\n${end}]` : "[]";
    if (isObject(v)) {
      const entries = Object.entries(v);
      return entries.length ? `{\n${entries.map(([k, item]) => `${pad}${keyText(k)}: ${walk(item, depth + 1)}`).join(",\n")}${comma}\n${end}}` : "{}";
    }
    return typeof v === "string" ? str(v) : String(v);
  };
  return walk(value, 0);
}

/* ---------- inspection ---------- */
export function describe(value: Json): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return `array, ${value.length} item${value.length === 1 ? "" : "s"}`;
  if (isObject(value)) { const n = Object.keys(value).length; return `object, ${n} key${n === 1 ? "" : "s"}`; }
  return typeof value;
}

export function depthOf(value: Json): number {
  if (Array.isArray(value)) return 1 + Math.max(0, ...value.map(depthOf));
  if (isObject(value)) return 1 + Math.max(0, ...Object.values(value).map(depthOf));
  return 0;
}

const preview = (v: Json, max: number) => { const s = JSON.stringify(v); return s.length > max ? `${s.slice(0, max - 1)}…` : s; };

export function treeOutline(value: Json, maxDepth: number): string {
  const lines = [`$ (${describe(value)})`];
  const walk = (node: Json, prefix: string, depth: number) => {
    const entries: Array<[string, Json]> = Array.isArray(node) ? node.map((v, i) => [`[${i}]`, v]) : isObject(node) ? Object.entries(node) : [];
    entries.forEach(([label, child], i) => {
      const last = i === entries.length - 1;
      const branch = `${prefix}${last ? "└─ " : "├─ "}`;
      const container = Array.isArray(child) || isObject(child);
      lines.push(container ? `${branch}${label} (${describe(child)})` : `${branch}${label}: ${preview(child, 60)}`);
      if (container && depth < maxDepth) walk(child, `${prefix}${last ? "   " : "│  "}`, depth + 1);
    });
  };
  walk(value, "", 1);
  return lines.join("\n");
}

export function pathSegment(key: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(key) ? `.${key}` : `[${JSON.stringify(key)}]`;
}

export function leafPaths(value: Json, leavesOnly: boolean): Array<[string, Json]> {
  const out: Array<[string, Json]> = [];
  const walk = (node: Json, path: string) => {
    const container = Array.isArray(node) || isObject(node);
    if (!container || !leavesOnly) out.push([path, node]);
    if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (isObject(node)) Object.entries(node).forEach(([k, v]) => walk(v, path + pathSegment(k)));
  };
  walk(value, "$");
  return out;
}

export function typeName(v: Json): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
}

/* ---------- diff, merge, sort ---------- */
export function jsonDiff(a: Json, b: Json): string[] {
  const out: string[] = [];
  const walk = (x: Json | undefined, y: Json | undefined, path: string) => {
    if (x === undefined) { out.push(`+ ${path}: ${preview(y as Json, 80)}`); return; }
    if (y === undefined) { out.push(`- ${path}: ${preview(x, 80)}`); return; }
    if (Array.isArray(x) && Array.isArray(y)) {
      for (let i = 0; i < Math.max(x.length, y.length); i++) walk(x[i], y[i], `${path}[${i}]`);
      return;
    }
    if (isObject(x) && isObject(y)) {
      const keys = [...Object.keys(x), ...Object.keys(y).filter(k => !has(x, k))];
      keys.forEach(k => walk(has(x, k) ? x[k] : undefined, has(y, k) ? y[k] : undefined, path + pathSegment(k)));
      return;
    }
    if (JSON.stringify(x) !== JSON.stringify(y)) out.push(`~ ${path}: ${preview(x, 60)} → ${preview(y, 60)}`);
  };
  walk(a, b, "$");
  return out;
}

export function deepMerge(base: Json, patch: Json, arrays: string): Json {
  if (isObject(base) && isObject(patch)) {
    const keys = [...Object.keys(base), ...Object.keys(patch).filter(k => !has(base, k))];
    return Object.fromEntries(keys.map(k => [k, has(patch, k) ? (has(base, k) ? deepMerge(base[k], patch[k], arrays) : patch[k]) : base[k]]));
  }
  if (Array.isArray(base) && Array.isArray(patch)) {
    if (arrays === "concat") return [...base, ...patch];
    if (arrays === "union") return [...base, ...patch.filter(p => !base.some(b => JSON.stringify(b) === JSON.stringify(p)))];
  }
  return patch;
}

export function sortKeys(value: Json, order: string): Json {
  if (Array.isArray(value)) return value.map(v => sortKeys(v, order));
  if (!isObject(value)) return value;
  const collator = new Intl.Collator("en", { numeric: true, sensitivity: order === "ci" ? "base" : "variant" });
  const keys = Object.keys(value).sort((a, b) => (order === "desc" ? collator.compare(b, a) : order === "code" ? (a < b ? -1 : a > b ? 1 : 0) : collator.compare(a, b)));
  return Object.fromEntries(keys.map(k => [k, sortKeys(value[k], order)]));
}
