// A small, strict XML 1.0 parser (no DTD processing) plus formatter, minifier and JSON mapping.
// Supported: elements, attributes, text, CDATA, comments, processing instructions, a DOCTYPE without
// an internal subset, and the five predefined entities plus numeric character references.
import { has, isObject, setOwn, type Json, type JsonObject } from "./dev-text-util.ts";

export type XmlNode =
  | { type: "element"; name: string; attrs: Array<[string, string]>; children: XmlNode[] }
  | { type: "text"; value: string }
  | { type: "cdata"; value: string }
  | { type: "comment"; value: string }
  | { type: "pi"; value: string }
  | { type: "doctype"; value: string };
export type XmlElement = Extract<XmlNode, { type: "element" }>;

const NAME = /^[A-Za-z_:][\w.:-]*/;
const ENTITIES: Record<string, string> = { lt: "<", gt: ">", amp: "&", quot: '"', apos: "'" };

class XmlReader {
  pos = 0;
  readonly src: string;
  constructor(src: string) { this.src = src; }
  fail(message: string): never {
    const before = this.src.slice(0, this.pos).split("\n");
    throw new Error(`XML error at line ${before.length}, column ${before[before.length - 1].length + 1}: ${message}`);
  }
  startsWith(token: string) { return this.src.startsWith(token, this.pos); }
  skipSpace() { while (this.pos < this.src.length && /\s/.test(this.src[this.pos])) this.pos++; }
  readUntil(token: string, what: string): string {
    const end = this.src.indexOf(token, this.pos);
    if (end < 0) this.fail(`unclosed ${what}`);
    const value = this.src.slice(this.pos, end);
    this.pos = end + token.length;
    return value;
  }
  readName(): string {
    const match = NAME.exec(this.src.slice(this.pos, this.pos + 200));
    if (!match) this.fail("expected a tag or attribute name");
    this.pos += match[0].length;
    return match[0];
  }
}

export function decodeEntities(text: string, reader?: XmlReader): string {
  return text.replace(/&([^;\s&]*);?/g, (whole, name: string) => {
    if (!whole.endsWith(";")) return reader ? reader.fail(`"&" must be written as &amp;`) : whole;
    if (name in ENTITIES) return ENTITIES[name];
    const code = name.startsWith("#x") ? parseInt(name.slice(2), 16) : name.startsWith("#") ? parseInt(name.slice(1), 10) : NaN;
    if (Number.isFinite(code) && code > 0 && code <= 0x10ffff) return String.fromCodePoint(code);
    return reader ? reader.fail(`unknown entity &${name};`) : whole;
  });
}

function readAttributes(r: XmlReader): Array<[string, string]> {
  const attrs: Array<[string, string]> = [];
  for (;;) {
    r.skipSpace();
    if (r.startsWith("/>") || r.startsWith(">")) return attrs;
    const name = r.readName();
    r.skipSpace();
    if (!r.startsWith("=")) r.fail(`attribute "${name}" needs a value`);
    r.pos++;
    r.skipSpace();
    const quote = r.src[r.pos];
    if (quote !== '"' && quote !== "'") r.fail(`attribute "${name}" value must be quoted`);
    r.pos++;
    const raw = r.readUntil(quote, "attribute value");
    if (raw.includes("<")) r.fail(`"<" is not allowed inside attribute "${name}"`);
    if (attrs.some(([existing]) => existing === name)) r.fail(`duplicate attribute "${name}"`);
    attrs.push([name, decodeEntities(raw, r)]);
  }
}

function readMarkup(r: XmlReader): XmlNode | null {
  if (r.startsWith("<!--")) { r.pos += 4; return { type: "comment", value: r.readUntil("-->", "comment") }; }
  if (r.startsWith("<![CDATA[")) { r.pos += 9; return { type: "cdata", value: r.readUntil("]]>", "CDATA section") }; }
  if (r.startsWith("<?")) { r.pos += 2; return { type: "pi", value: r.readUntil("?>", "processing instruction") }; }
  if (r.startsWith("<!DOCTYPE")) {
    const value = r.readUntil(">", "DOCTYPE");
    if (value.includes("[")) r.fail("DOCTYPE internal subsets (DTD declarations) are not supported");
    return { type: "doctype", value: value.slice(2) };
  }
  return null;
}

function readElement(r: XmlReader): XmlElement {
  r.pos++; // "<"
  const name = r.readName();
  const attrs = readAttributes(r);
  if (r.startsWith("/>")) { r.pos += 2; return { type: "element", name, attrs, children: [] }; }
  r.pos++; // ">"
  const children: XmlNode[] = [];
  for (;;) {
    if (r.pos >= r.src.length) r.fail(`<${name}> is never closed`);
    if (r.startsWith("</")) {
      r.pos += 2;
      const close = r.readName();
      if (close !== name) r.fail(`expected </${name}> but found </${close}>`);
      r.skipSpace();
      if (!r.startsWith(">")) r.fail(`malformed closing tag </${close}`);
      r.pos++;
      return { type: "element", name, attrs, children };
    }
    const markup = readMarkup(r);
    if (markup) { if (markup.type === "doctype") r.fail("DOCTYPE is only allowed before the root element"); children.push(markup); continue; }
    if (r.startsWith("<")) { children.push(readElement(r)); continue; }
    const next = r.src.indexOf("<", r.pos);
    const raw = r.src.slice(r.pos, next < 0 ? r.src.length : next);
    if (raw.includes("]]>")) r.fail('"]]>" is not allowed in text');
    r.pos += raw.length;
    children.push({ type: "text", value: decodeEntities(raw, r) });
  }
}

/** Parses a whole document. Returns the top-level nodes; exactly one of them is the root element. */
export function parseXml(input: string): XmlNode[] {
  const src = input.replace(/^﻿/, "");
  if (!src.trim()) throw new Error("Paste some XML first.");
  const r = new XmlReader(src);
  const nodes: XmlNode[] = [];
  let root = false;
  while (r.pos < src.length) {
    r.skipSpace();
    if (r.pos >= src.length) break;
    const markup = readMarkup(r);
    if (markup) { nodes.push(markup); continue; }
    if (!r.startsWith("<")) r.fail("text is not allowed outside the root element");
    if (root) r.fail("an XML document can only have one root element");
    nodes.push(readElement(r));
    root = true;
  }
  if (!root) throw new Error("No root element found.");
  return nodes;
}

export function rootElement(nodes: XmlNode[]): XmlElement {
  return nodes.find((n): n is XmlElement => n.type === "element") as XmlElement;
}

/* ---------- serialising ---------- */
const escText = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const openTag = (el: XmlElement) => `<${el.name}${el.attrs.map(([k, v]) => ` ${k}="${escAttr(v)}"`).join("")}`;

function inline(node: XmlNode, keepComments: boolean): string {
  switch (node.type) {
    case "text": return escText(node.value);
    case "cdata": return `<![CDATA[${node.value}]]>`;
    case "comment": return keepComments ? `<!--${node.value}-->` : "";
    case "pi": return `<?${node.value}?>`;
    case "doctype": return `<!${node.value}>`;
    case "element": {
      const inner = node.children.map(child => inline(child, keepComments)).join("");
      return node.children.length ? `${openTag(node)}>${inner}</${node.name}>` : `${openTag(node)}/>`;
    }
  }
}

const isBlank = (n: XmlNode) => n.type === "text" && !n.value.trim();

function pretty(node: XmlNode, depth: number, unit: string, keepComments: boolean): string[] {
  const pad = unit.repeat(depth);
  if (node.type !== "element") {
    if (node.type === "text") return [pad + escText(node.value.trim())];
    const text = inline(node, keepComments);
    return text ? [pad + text] : [];
  }
  const kids = node.children.filter(child => !isBlank(child) && (keepComments || child.type !== "comment"));
  if (!kids.length) return [`${pad}${openTag(node)}/>`];
  const mixed = kids.some(k => k.type === "text" || k.type === "cdata");
  if (mixed) return [pad + inline({ ...node, children: node.children.filter(c => keepComments || c.type !== "comment") }, keepComments)];
  return [`${pad}${openTag(node)}>`, ...kids.flatMap(k => pretty(k, depth + 1, unit, keepComments)), `${pad}</${node.name}>`];
}

export function formatXml(input: string, unit: string, keepComments = true): string {
  return parseXml(input).flatMap(node => pretty(node, 0, unit, keepComments)).join("\n") + "\n";
}

export function minifyXml(input: string, keepComments: boolean): string {
  const strip = (node: XmlNode): XmlNode => node.type === "element"
    ? { ...node, children: node.children.filter(c => !isBlank(c)).map(strip) }
    : node;
  return parseXml(input).map(node => inline(strip(node), keepComments)).join("");
}

export function xmlStats(input: string): string {
  const nodes = parseXml(input);
  let elements = 0, attributes = 0, maxDepth = 0;
  const walk = (node: XmlNode, depth: number) => {
    if (node.type !== "element") return;
    elements++; attributes += node.attrs.length; maxDepth = Math.max(maxDepth, depth);
    node.children.forEach(child => walk(child, depth + 1));
  };
  nodes.forEach(node => walk(node, 1));
  const root = rootElement(nodes);
  return [`✓ Well-formed XML`, `Root element: <${root.name}>`, `Elements: ${elements}`, `Attributes: ${attributes}`, `Maximum depth: ${maxDepth}`].join("\n");
}

/* ---------- XML ⇄ JSON ---------- */
function elementToJson(el: XmlElement, attrPrefix: string): Json {
  const obj: JsonObject = {};
  el.attrs.forEach(([k, v]) => setOwn(obj, attrPrefix + k, v));
  const text = el.children.filter(c => c.type === "text" || c.type === "cdata").map(c => (c as { value: string }).value).join("").trim();
  const elements = el.children.filter((c): c is XmlElement => c.type === "element");
  const counts = new Map<string, number>();
  elements.forEach(child => counts.set(child.name, (counts.get(child.name) ?? 0) + 1));
  for (const child of elements) {
    const value = elementToJson(child, attrPrefix);
    if ((counts.get(child.name) ?? 0) > 1) setOwn(obj, child.name, [...((has(obj, child.name) ? obj[child.name] : []) as Json[]), value]);
    else setOwn(obj, child.name, value);
  }
  if (!el.attrs.length && !elements.length) return text;
  if (text) setOwn(obj, "#text", text);
  return obj;
}

export function xmlToJson(input: string, attrPrefix: string): JsonObject {
  const root = rootElement(parseXml(input));
  return { [root.name]: elementToJson(root, attrPrefix) };
}

const safeName = (key: string) => {
  const cleaned = key.replace(/[^\w.:-]/g, "_");
  return /^[A-Za-z_]/.test(cleaned) && !/^xml/i.test(cleaned) ? cleaned : `_${cleaned}`;
};
const scalarText = (value: Json) => (value === null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value));

function jsonToElement(name: string, value: Json, attrPrefix: string, pad: string, depth: number): string[] {
  const at = pad.repeat(depth);
  const tag = safeName(name);
  if (Array.isArray(value)) return value.flatMap(item => (Array.isArray(item) ? jsonToElement(name, { item }, attrPrefix, pad, depth) : jsonToElement(name, item, attrPrefix, pad, depth)));
  if (!isObject(value)) return value === null ? [`${at}<${tag}/>`] : [`${at}<${tag}>${escText(scalarText(value))}</${tag}>`];
  const entries = Object.entries(value);
  const attrs = entries.filter(([k]) => attrPrefix && k.startsWith(attrPrefix) && k.length > attrPrefix.length)
    .map(([k, v]) => ` ${safeName(k.slice(attrPrefix.length))}="${escAttr(scalarText(v))}"`).join("");
  const text = value["#text"];
  const children = entries.filter(([k]) => k !== "#text" && !(attrPrefix && k.startsWith(attrPrefix) && k.length > attrPrefix.length));
  if (!children.length && (text === undefined || text === null)) return [`${at}<${tag}${attrs}/>`];
  if (!children.length) return [`${at}<${tag}${attrs}>${escText(scalarText(text as Json))}</${tag}>`];
  const inner = children.flatMap(([k, v]) => jsonToElement(k, v, attrPrefix, pad, depth + 1));
  const textLine = text === undefined || text === null ? [] : [`${pad.repeat(depth + 1)}${escText(scalarText(text))}`];
  return [`${at}<${tag}${attrs}>`, ...textLine, ...inner, `${at}</${tag}>`];
}

export function jsonToXml(value: Json, rootName: string, attrPrefix: string, pad: string, declaration: boolean): string {
  const head = declaration ? '<?xml version="1.0" encoding="UTF-8"?>\n' : "";
  const single = isObject(value) && Object.keys(value).length === 1 && !Array.isArray(Object.values(value)[0]);
  const body = single
    ? jsonToElement(Object.keys(value as JsonObject)[0], Object.values(value as JsonObject)[0], attrPrefix, pad, 0)
    : jsonToElement(rootName, Array.isArray(value) ? { item: value } : value, attrPrefix, pad, 0);
  return head + body.join("\n") + "\n";
}
