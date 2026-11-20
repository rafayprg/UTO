// JSONPath (documented subset), a JSON Schema validator (subset of draft 2020-12) and schema → sample JSON.
import { has, isObject, type Json, type JsonObject } from "./dev-text-util.ts";
import { pathSegment } from "./dev-text-json.ts";

/* ---------- JSONPath ---------- */
type Selector =
  | { kind: "name"; name: string }
  | { kind: "index"; index: number }
  | { kind: "wild" }
  | { kind: "slice"; start?: number; end?: number; step: number }
  | { kind: "filter"; expr: string };
interface Segment { descendant: boolean; selectors: Selector[] }
export interface Match { path: string; value: Json }

function splitTopLevel(text: string, separator: string): string[] {
  const parts: string[] = [];
  let depth = 0, quote = "", start = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote) { if (ch === "\\") i++; else if (ch === quote) quote = ""; continue; }
    if (ch === "'" || ch === '"') quote = ch;
    else if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    else if (depth === 0 && text.startsWith(separator, i)) { parts.push(text.slice(start, i)); start = i + separator.length; i += separator.length - 1; }
  }
  parts.push(text.slice(start));
  return parts.map(p => p.trim());
}

function unquote(text: string): string | null {
  const m = /^'((?:[^'\\]|\\.)*)'$|^"((?:[^"\\]|\\.)*)"$/.exec(text);
  if (!m) return null;
  return (m[1] ?? m[2]).replace(/\\(.)/g, "$1");
}

function parseSelector(raw: string): Selector {
  const text = raw.trim();
  if (text === "*") return { kind: "wild" };
  if (/^\?\(.*\)$/s.test(text)) return { kind: "filter", expr: text.slice(2, -1) };
  if (text.startsWith("?")) return { kind: "filter", expr: text.slice(1) };
  const name = unquote(text);
  if (name !== null) return { kind: "name", name };
  if (/^-?\d+$/.test(text)) return { kind: "index", index: Number(text) };
  const slice = /^(-?\d*)\s*:\s*(-?\d*)(?:\s*:\s*(-?\d*))?$/.exec(text);
  if (slice) {
    const step = slice[3] ? Number(slice[3]) : 1;
    if (step === 0) throw new Error("A slice step cannot be 0.");
    return { kind: "slice", start: slice[1] ? Number(slice[1]) : undefined, end: slice[2] ? Number(slice[2]) : undefined, step };
  }
  throw new Error(`Unsupported selector [${text}].`);
}

export function parsePath(path: string): Segment[] {
  const src = path.trim();
  if (!src.startsWith("$")) throw new Error('A JSONPath starts with "$", for example $.store.book[0].title');
  const segments: Segment[] = [];
  let i = 1;
  while (i < src.length) {
    let descendant = false;
    if (src.startsWith("..", i)) { descendant = true; i += 2; }
    else if (src[i] === ".") i += 1;
    else if (src[i] !== "[") throw new Error(`Unexpected "${src[i]}" at position ${i + 1} of the path.`);
    if (src[i] === "[") {
      let depth = 0, quote = "", j = i;
      for (; j < src.length; j++) {
        const ch = src[j];
        if (quote) { if (ch === "\\") j++; else if (ch === quote) quote = ""; continue; }
        if (ch === "'" || ch === '"') quote = ch;
        else if (ch === "[" || ch === "(") depth++;
        else if (ch === "]" || ch === ")") { depth--; if (depth === 0 && ch === "]") break; }
      }
      if (j >= src.length) throw new Error("A [ in the path is never closed.");
      segments.push({ descendant, selectors: splitTopLevel(src.slice(i + 1, j), ",").map(parseSelector) });
      i = j + 1;
      continue;
    }
    const name = /^(\*|[^.[\]\s]+)/.exec(src.slice(i));
    if (!name) throw new Error(`Expected a key name at position ${i + 1} of the path.`);
    segments.push({ descendant, selectors: [name[1] === "*" ? { kind: "wild" } : { kind: "name", name: name[1] }] });
    i += name[1].length;
  }
  return segments;
}

function children(node: Match): Match[] {
  if (Array.isArray(node.value)) return node.value.map((v, i) => ({ path: `${node.path}[${i}]`, value: v }));
  if (isObject(node.value)) return Object.entries(node.value).map(([k, v]) => ({ path: node.path + pathSegment(k), value: v }));
  return [];
}

function descendants(node: Match): Match[] {
  return [node, ...children(node).flatMap(descendants)];
}

function literal(text: string): Json | undefined {
  const t = text.trim();
  const q = unquote(t);
  if (q !== null) return q;
  if (t === "true") return true;
  if (t === "false") return false;
  if (t === "null") return null;
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(t)) return Number(t);
  return undefined;
}

function resolveRelative(node: Json, expr: string): Json | undefined {
  const t = expr.trim();
  if (!t.startsWith("@")) return literal(t);
  let current: Json | undefined = node;
  for (const seg of parsePath(`$${t.slice(1)}`)) {
    const sel = seg.selectors[0];
    if (seg.descendant || seg.selectors.length !== 1) throw new Error("Filters support simple @.key or @['key'] paths only.");
    if (sel.kind === "name" && sel.name === "length" && (Array.isArray(current) || typeof current === "string")) current = current.length;
    else if (sel.kind === "name" && isObject(current)) current = has(current, sel.name) ? current[sel.name] : undefined;
    else if (sel.kind === "index" && Array.isArray(current)) current = current[sel.index < 0 ? current.length + sel.index : sel.index];
    else return undefined;
  }
  return current;
}

function testFilter(node: Json, expr: string): boolean {
  const ors = splitTopLevel(expr, "||");
  if (ors.length > 1) return ors.some(part => testFilter(node, part));
  const ands = splitTopLevel(expr, "&&");
  if (ands.length > 1) return ands.every(part => testFilter(node, part));
  let t = expr.trim();
  while (t.startsWith("(") && t.endsWith(")")) t = t.slice(1, -1).trim();
  if (t.startsWith("!")) return !testFilter(node, t.slice(1));
  for (const op of ["==", "!=", "<=", ">=", "<", ">"]) {
    const parts = splitTopLevel(t, op);
    if (parts.length !== 2) continue;
    const left = resolveRelative(node, parts[0]);
    const right = resolveRelative(node, parts[1]);
    if (left === undefined || right === undefined) return op === "!=" ? left !== right : false;
    if (op === "==") return JSON.stringify(left) === JSON.stringify(right);
    if (op === "!=") return JSON.stringify(left) !== JSON.stringify(right);
    if (typeof left !== typeof right || (typeof left !== "number" && typeof left !== "string")) return false;
    const l = left as number | string, r = right as number | string;
    return op === "<" ? l < r : op === ">" ? l > r : op === "<=" ? l <= r : l >= r;
  }
  if (t.startsWith("@")) return resolveRelative(node, t) !== undefined;
  throw new Error(`Unsupported filter expression "${t}".`);
}

function select(node: Match, sel: Selector): Match[] {
  const value = node.value;
  if (sel.kind === "wild") return children(node);
  if (sel.kind === "name") return isObject(value) && has(value, sel.name) ? [{ path: node.path + pathSegment(sel.name), value: value[sel.name] }] : [];
  if (sel.kind === "filter") return children(node).filter(child => testFilter(child.value, sel.expr));
  if (!Array.isArray(value)) return [];
  const len = value.length;
  const norm = (i: number) => (i < 0 ? len + i : i);
  if (sel.kind === "index") { const i = norm(sel.index); return i >= 0 && i < len ? [{ path: `${node.path}[${i}]`, value: value[i] }] : []; }
  const out: Match[] = [];
  const { step } = sel;
  const start = sel.start === undefined ? (step > 0 ? 0 : len - 1) : Math.min(Math.max(norm(sel.start), step > 0 ? 0 : -1), step > 0 ? len : len - 1);
  const end = sel.end === undefined ? (step > 0 ? len : -1) : Math.min(Math.max(norm(sel.end), step > 0 ? 0 : -1), step > 0 ? len : len - 1);
  for (let i = start; step > 0 ? i < end : i > end; i += step) out.push({ path: `${node.path}[${i}]`, value: value[i] });
  return out;
}

export function queryPath(doc: Json, path: string): Match[] {
  let nodes: Match[] = [{ path: "$", value: doc }];
  for (const seg of parsePath(path)) {
    const bases = seg.descendant ? nodes.flatMap(descendants) : nodes;
    nodes = bases.flatMap(node => seg.selectors.flatMap(sel => select(node, sel)));
  }
  return nodes;
}

/* ---------- JSON Schema validation (subset) ---------- */
const typeOf = (v: Json): string => (v === null ? "null" : Array.isArray(v) ? "array" : typeof v === "number" ? (Number.isInteger(v) ? "integer" : "number") : typeof v);
const matchesType = (v: Json, t: string) => { const actual = typeOf(v); return t === actual || (t === "number" && actual === "integer"); };
const equal = (a: Json, b: Json) => JSON.stringify(a) === JSON.stringify(b);

function resolveRef(root: JsonObject, ref: string): Json {
  if (!ref.startsWith("#")) throw new Error(`Only local $ref values (starting with #) are supported, not "${ref}".`);
  let node: Json = root;
  for (const raw of ref.slice(1).split("/").filter(Boolean)) {
    const part = decodeURIComponent(raw).replace(/~1/g, "/").replace(/~0/g, "~");
    if (!isObject(node) || !has(node, part)) throw new Error(`$ref "${ref}" points to nothing.`);
    node = node[part];
  }
  return node;
}

export function validateSchema(data: Json, schema: Json): string[] {
  if (!isObject(schema) && typeof schema !== "boolean") throw new Error("The schema must be a JSON object.");
  const root = isObject(schema) ? schema : {};
  const errors: string[] = [];
  const check = (value: Json, s: Json, path: string, depth: number): void => {
    if (depth > 64) throw new Error("The schema recursion is too deep (more than 64 levels).");
    if (s === true) return;
    if (s === false) { errors.push(`${path}: no value is allowed here (schema is false)`); return; }
    if (!isObject(s)) return;
    if (typeof s.$ref === "string") check(value, resolveRef(root, s.$ref), path, depth + 1);
    const types = typeof s.type === "string" ? [s.type] : Array.isArray(s.type) ? (s.type as string[]) : null;
    if (types && !types.some(t => matchesType(value, t))) { errors.push(`${path}: expected ${types.join(" or ")}, got ${typeOf(value)}`); return; }
    if (Array.isArray(s.enum) && !s.enum.some(e => equal(e, value))) errors.push(`${path}: must be one of ${JSON.stringify(s.enum)}`);
    if (has(s, "const") && !equal(s.const, value)) errors.push(`${path}: must equal ${JSON.stringify(s.const)}`);
    if (typeof value === "number") checkNumber(value, s, path);
    if (typeof value === "string") checkString(value, s, path);
    if (Array.isArray(value)) {
      const len = value.length;
      if (typeof s.minItems === "number" && len < s.minItems) errors.push(`${path}: needs at least ${s.minItems} items, has ${len}`);
      if (typeof s.maxItems === "number" && len > s.maxItems) errors.push(`${path}: allows at most ${s.maxItems} items, has ${len}`);
      if (s.uniqueItems === true && new Set(value.map(v => JSON.stringify(v))).size !== len) errors.push(`${path}: items must be unique`);
      if (s.items !== undefined) value.forEach((item, i) => check(item, s.items as Json, `${path}[${i}]`, depth + 1));
    }
    if (isObject(value)) {
      const props = isObject(s.properties) ? s.properties : {};
      if (Array.isArray(s.required)) s.required.forEach(k => { if (typeof k === "string" && !has(value, k)) errors.push(`${path}: missing required property "${k}"`); });
      const count = Object.keys(value).length;
      if (typeof s.minProperties === "number" && count < s.minProperties) errors.push(`${path}: needs at least ${s.minProperties} properties`);
      if (typeof s.maxProperties === "number" && count > s.maxProperties) errors.push(`${path}: allows at most ${s.maxProperties} properties`);
      for (const [k, v] of Object.entries(value)) {
        if (has(props, k)) check(v, props[k], path + pathSegment(k), depth + 1);
        else if (s.additionalProperties === false) errors.push(`${path}: property "${k}" is not allowed`);
        else if (isObject(s.additionalProperties)) check(v, s.additionalProperties, path + pathSegment(k), depth + 1);
      }
    }
    if (Array.isArray(s.allOf)) s.allOf.forEach(sub => check(value, sub, path, depth + 1));
    const passes = (sub: Json) => { const before = errors.length; check(value, sub, path, depth + 1); const ok = errors.length === before; errors.length = before; return ok; };
    if (Array.isArray(s.anyOf) && !s.anyOf.some(passes)) errors.push(`${path}: does not match any schema in anyOf`);
    if (Array.isArray(s.oneOf)) { const n = s.oneOf.filter(passes).length; if (n !== 1) errors.push(`${path}: must match exactly one schema in oneOf (matched ${n})`); }
    if (s.not !== undefined && passes(s.not)) errors.push(`${path}: must not match the "not" schema`);
  };
  const checkNumber = (value: number, s: JsonObject, path: string) => {
    if (typeof s.minimum === "number" && value < s.minimum) errors.push(`${path}: must be ≥ ${s.minimum}`);
    if (typeof s.maximum === "number" && value > s.maximum) errors.push(`${path}: must be ≤ ${s.maximum}`);
    if (typeof s.exclusiveMinimum === "number" && value <= s.exclusiveMinimum) errors.push(`${path}: must be > ${s.exclusiveMinimum}`);
    if (typeof s.exclusiveMaximum === "number" && value >= s.exclusiveMaximum) errors.push(`${path}: must be < ${s.exclusiveMaximum}`);
    if (typeof s.multipleOf === "number" && s.multipleOf > 0 && Math.abs(value / s.multipleOf - Math.round(value / s.multipleOf)) > 1e-9) errors.push(`${path}: must be a multiple of ${s.multipleOf}`);
  };
  const checkString = (value: string, s: JsonObject, path: string) => {
    const len = [...value].length;
    if (typeof s.minLength === "number" && len < s.minLength) errors.push(`${path}: must be at least ${s.minLength} characters`);
    if (typeof s.maxLength === "number" && len > s.maxLength) errors.push(`${path}: must be at most ${s.maxLength} characters`);
    if (typeof s.pattern === "string") {
      let re: RegExp;
      try { re = new RegExp(s.pattern, "u"); } catch { throw new Error(`The schema pattern ${JSON.stringify(s.pattern)} is not a valid regular expression.`); }
      if (!re.test(value)) errors.push(`${path}: must match the pattern ${s.pattern}`);
    }
  };
  check(data, schema, "$", 0);
  return errors;
}

/* ---------- schema → sample JSON ---------- */
const FORMAT_SAMPLES: Record<string, string> = {
  email: "user@example.com", "date-time": "2024-01-15T09:30:00Z", date: "2024-01-15", time: "09:30:00Z",
  uri: "https://example.com", url: "https://example.com", uuid: "123e4567-e89b-42d3-a456-426614174000",
  hostname: "example.com", ipv4: "192.0.2.1", ipv6: "2001:db8::1",
};

export function sampleFromSchema(schema: Json, requiredOnly: boolean): Json {
  if (!isObject(schema)) throw new Error("The schema must be a JSON object.");
  const root = schema;
  const build = (s: Json, depth: number): Json => {
    if (!isObject(s) || depth > 12) return null;
    if (typeof s.$ref === "string") return build(resolveRef(root, s.$ref), depth + 1);
    if (has(s, "const")) return s.const;
    if (Array.isArray(s.examples) && s.examples.length) return s.examples[0];
    if (has(s, "default")) return s.default;
    if (Array.isArray(s.enum) && s.enum.length) return s.enum[0];
    for (const key of ["oneOf", "anyOf"]) { const list = s[key]; if (Array.isArray(list) && list.length) return build(list[0], depth + 1); }
    if (Array.isArray(s.allOf)) return s.allOf.reduce<Json>((acc, sub) => { const part = build(sub, depth + 1); return isObject(acc) && isObject(part) ? { ...acc, ...part } : part; }, {});
    const type = Array.isArray(s.type) ? (s.type as Json[]).find(t => t !== "null") : s.type ?? (isObject(s.properties) ? "object" : s.items ? "array" : undefined);
    if (type === "object") {
      const props = isObject(s.properties) ? s.properties : {};
      const required = Array.isArray(s.required) ? s.required : [];
      return Object.fromEntries(Object.entries(props).filter(([k]) => !requiredOnly || required.includes(k)).map(([k, v]) => [k, build(v, depth + 1)]));
    }
    if (type === "array") return Array.from({ length: Math.max(1, typeof s.minItems === "number" ? s.minItems : 1) }, () => build(s.items ?? {}, depth + 1));
    if (type === "string") {
      if (typeof s.format === "string" && FORMAT_SAMPLES[s.format]) return FORMAT_SAMPLES[s.format];
      const min = typeof s.minLength === "number" ? s.minLength : 0;
      return "string".padEnd(min, "x");
    }
    if (type === "integer" || type === "number") {
      if (typeof s.minimum === "number") return s.minimum;
      if (typeof s.exclusiveMinimum === "number") return type === "integer" ? Math.floor(s.exclusiveMinimum) + 1 : s.exclusiveMinimum + 1;
      if (typeof s.maximum === "number" && s.maximum < 0) return s.maximum;
      return 0;
    }
    if (type === "boolean") return true;
    return null;
  };
  return build(schema, 0);
}
