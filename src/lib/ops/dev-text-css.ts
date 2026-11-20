// A small CSS parser (rules, nested rules, at-rules, comments) with minifier, formatter, property sorter,
// SCSS nesting and CSS → JS object conversion. Strings, url() and comments are tokenised safely.

export type CssNode =
  | { type: "rule"; selector: string; children: CssNode[] }
  | { type: "at"; name: string; prelude: string; children: CssNode[] | null }
  | { type: "decl"; prop: string; value: string; important: boolean }
  | { type: "comment"; text: string };

interface Chunk { text: string; end: "{" | ";" | "}" | "eof"; comments: string[] }

class CssReader {
  pos = 0;
  readonly src: string;
  constructor(src: string) { this.src = src; }
  /** Reads up to the next top-level { ; or }, skipping strings, parentheses and comments. */
  chunk(): Chunk {
    let text = "";
    let depth = 0;
    const comments: string[] = [];
    while (this.pos < this.src.length) {
      const ch = this.src[this.pos];
      if (ch === "/" && this.src[this.pos + 1] === "*") {
        const end = this.src.indexOf("*/", this.pos + 2);
        if (end < 0) throw new Error("A /* comment is never closed.");
        comments.push(this.src.slice(this.pos + 2, end));
        this.pos = end + 2;
        text += " ";
        continue;
      }
      if (ch === '"' || ch === "'") {
        let j = this.pos + 1;
        while (j < this.src.length && this.src[j] !== ch) { if (this.src[j] === "\\") j++; if (this.src[j] === "\n") throw new Error("A string in the CSS is not closed."); j++; }
        if (j >= this.src.length) throw new Error("A string in the CSS is not closed.");
        text += this.src.slice(this.pos, j + 1);
        this.pos = j + 1;
        continue;
      }
      if (ch === "(") depth++;
      if (ch === ")") depth = Math.max(0, depth - 1);
      if (depth === 0 && (ch === "{" || ch === ";" || ch === "}")) { this.pos++; return { text, end: ch, comments }; }
      text += ch;
      this.pos++;
    }
    return { text, end: "eof", comments };
  }
}

function splitDecl(text: string): CssNode | null {
  const colon = text.indexOf(":");
  if (colon < 0) return null;
  const prop = text.slice(0, colon).trim();
  let value = text.slice(colon + 1).trim().replace(/\s+/g, " ");
  const important = /!\s*important$/i.test(value);
  if (important) value = value.replace(/\s*!\s*important$/i, "");
  return prop ? { type: "decl", prop, value, important } : null;
}

function parseBlock(r: CssReader, nested: boolean): CssNode[] {
  const nodes: CssNode[] = [];
  for (;;) {
    const { text, end, comments } = r.chunk();
    comments.forEach(c => nodes.push({ type: "comment", text: c }));
    const t = text.trim();
    if (end === "{") {
      if (t.startsWith("@")) {
        const m = /^@([\w-]+)\s*([\s\S]*)$/.exec(t) as RegExpExecArray;
        nodes.push({ type: "at", name: m[1], prelude: m[2].trim().replace(/\s+/g, " "), children: parseBlock(r, true) });
      } else nodes.push({ type: "rule", selector: t.replace(/\s+/g, " "), children: parseBlock(r, true) });
      continue;
    }
    if (t) {
      if (t.startsWith("@")) {
        const m = /^@([\w-]+)\s*([\s\S]*)$/.exec(t);
        if (m) nodes.push({ type: "at", name: m[1], prelude: m[2].trim().replace(/\s+/g, " "), children: null });
      } else {
        const decl = splitDecl(t);
        if (!decl) throw new Error(`Cannot read "${t.slice(0, 60)}" — expected a property: value declaration.`);
        if (!nested) throw new Error(`"${t.slice(0, 60)}" is a declaration outside of any rule.`);
        nodes.push(decl);
      }
    }
    if (end === "}") { if (!nested) throw new Error('There is an extra "}" in the CSS.'); return nodes; }
    if (end === "eof") { if (nested) throw new Error('A "{" block is never closed.'); return nodes; }
  }
}

export function parseCss(css: string): CssNode[] {
  if (!css.trim()) throw new Error("Paste some CSS first.");
  return parseBlock(new CssReader(css), false);
}

/* ---------- minify ---------- */
function protectStrings(text: string, fn: (plain: string) => string): string {
  return text.split(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/).map((part, i) => (i % 2 ? part : fn(part))).join("");
}
const minSelector = (s: string) => protectStrings(s, p => p.replace(/\s*([>+~,])\s*/g, "$1").replace(/\s+/g, " ").trim());
const minValue = (v: string) => protectStrings(v, p => p
  .replace(/\s*,\s*/g, ",")
  .replace(/(^|[\s,(:])0+(\.\d)/g, "$1$2")
  .replace(/#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3\b/g, "#$1$2$3")
  .replace(/\s+/g, " ").trim());

export function minifyCss(css: string, keepLicense: boolean): string {
  const out = (nodes: CssNode[]): string => nodes.map(n => {
    if (n.type === "comment") return keepLicense && n.text.startsWith("!") ? `/*${n.text}*/` : "";
    if (n.type === "decl") return `${n.prop}:${minValue(n.value)}${n.important ? "!important" : ""};`;
    if (n.type === "rule") return `${minSelector(n.selector)}{${out(n.children).replace(/;$/, "")}}`;
    const prelude = n.prelude ? ` ${protectStrings(n.prelude, p => p.replace(/\s*([,:])\s*/g, "$1").replace(/\(\s+/g, "(").replace(/\s+\)/g, ")"))}` : "";
    return n.children === null ? `@${n.name}${prelude};` : `@${n.name}${prelude}{${out(n.children).replace(/;$/, "")}}`;
  }).join("");
  return out(parseCss(css));
}

/* ---------- format ---------- */
export function formatCss(css: string, unit: string, sortProps = false): string {
  const fmt = (nodes: CssNode[], depth: number): string[] => {
    const pad = unit.repeat(depth);
    const decls = nodes.filter((n): n is Extract<CssNode, { type: "decl" }> => n.type === "decl");
    const ordered = sortProps ? [...nodes.filter(n => n.type !== "decl"), ...[...decls].sort((a, b) => sortKey(a.prop).localeCompare(sortKey(b.prop)))] : nodes;
    const lines: string[] = [];
    ordered.forEach((n, i) => {
      if (n.type === "comment") { lines.push(`${pad}/*${n.text}*/`); return; }
      if (n.type === "decl") { lines.push(`${pad}${n.prop}: ${n.value}${n.important ? " !important" : ""};`); return; }
      if (i > 0 && depth === 0) lines.push("");
      if (n.type === "rule") {
        const selector = n.selector.split(/,(?![^(]*\))/).map(s => s.trim()).join(`,\n${pad}`);
        lines.push(`${pad}${selector} {`, ...fmt(n.children, depth + 1), `${pad}}`);
        return;
      }
      const head = `${pad}@${n.name}${n.prelude ? ` ${n.prelude}` : ""}`;
      if (n.children === null) lines.push(`${head};`);
      else lines.push(`${head} {`, ...fmt(n.children, depth + 1), `${pad}}`);
    });
    return lines;
  };
  return fmt(parseCss(css), 0).join("\n").replace(/\n{3,}/g, "\n\n") + "\n";
}

const sortKey = (prop: string) => prop.replace(/^-(webkit|moz|ms|o)-/, "") + (prop.startsWith("-") ? "0" : "1");

export function sortCssProperties(css: string, unit: string): string {
  return formatCss(css, unit, true);
}

/* ---------- CSS → SCSS (nesting of neighbouring rules) ---------- */
interface Tree { key: string; decls: CssNode[]; kids: Tree[]; raw?: CssNode }

function selectorParts(selector: string): string[] | null {
  if (/,(?![^(]*\))/.test(selector) || /["'[]/.test(selector)) return null;
  const tokens = selector.trim().replace(/\s*([>+~])\s*/g, " $1").split(/\s+(?![>+~])|\s+(?=[>+~])/).filter(Boolean);
  const parts: string[] = [];
  for (const token of tokens) {
    const pseudo = /^([^:]+)((?::{1,2}[\w-]+(?:\([^)]*\))?)+)$/.exec(token);
    if (pseudo && !/^[>+~]$/.test(pseudo[1])) { parts.push(pseudo[1], `&${pseudo[2]}`); continue; }
    parts.push(token.replace(/^([>+~])(?=\S)/, "$1 "));
  }
  return parts;
}

function insert(list: Tree[], parts: string[], decls: CssNode[]): void {
  const [head, ...rest] = parts;
  const last = list[list.length - 1];
  const node = last && last.key === head && !last.raw ? last : (() => { const fresh: Tree = { key: head, decls: [], kids: [] }; list.push(fresh); return fresh; })();
  if (rest.length) insert(node.kids, rest, decls);
  else node.decls = [...node.decls, ...decls];
}

function nestRules(nodes: CssNode[]): Tree[] {
  const roots: Tree[] = [];
  for (const n of nodes) {
    if (n.type === "rule") {
      const parts = selectorParts(n.selector);
      if (parts) insert(roots, parts, n.children);
      else roots.push({ key: n.selector, decls: n.children, kids: [] , raw: n });
    } else if (n.type === "at" && n.children && (n.name === "media" || n.name === "supports" || n.name === "container")) {
      roots.push({ key: `@${n.name} ${n.prelude}`, decls: [], kids: nestRules(n.children), raw: n });
    } else roots.push({ key: "", decls: [n], kids: [], raw: n });
  }
  return roots;
}

function printTree(list: Tree[], depth: number): string[] {
  const pad = "  ".repeat(depth);
  return list.flatMap((t, i) => {
    const spacer = i > 0 && depth === 0 ? [""] : [];
    const decls = t.decls.flatMap(d => (d.type === "decl" ? [`${pad}  ${d.prop}: ${d.value}${d.important ? " !important" : ""};`] : d.type === "comment" ? [`${pad}  /*${d.text}*/`] : []));
    if (!t.key) {
      const d = t.decls[0];
      if (d.type === "comment") return [...spacer, `${pad}/*${d.text}*/`];
      if (d.type === "at") return [...spacer, ...formatCss(minifyCss(stringifyNode(d), true), "  ").trimEnd().split("\n").map(l => pad + l)];
      return [];
    }
    const nestedRaw = t.raw && t.raw.type === "rule" && t.raw.children.some(c => c.type !== "decl" && c.type !== "comment");
    if (nestedRaw) return [...spacer, ...formatCss(stringifyNode(t.raw as CssNode), "  ").trimEnd().split("\n").map(l => pad + l)];
    return [...spacer, `${pad}${t.key} {`, ...decls, ...printTree(t.kids, depth + 1), `${pad}}`];
  });
}

export function stringifyNode(n: CssNode): string {
  if (n.type === "comment") return `/*${n.text}*/`;
  if (n.type === "decl") return `${n.prop}: ${n.value}${n.important ? " !important" : ""};`;
  if (n.type === "rule") return `${n.selector} { ${n.children.map(stringifyNode).join(" ")} }`;
  return n.children === null ? `@${n.name} ${n.prelude};` : `@${n.name} ${n.prelude} { ${n.children.map(stringifyNode).join(" ")} }`;
}

export function cssToScss(css: string): string {
  return printTree(nestRules(parseCss(css)), 0).join("\n") + "\n";
}

/* ---------- CSS → JS object ---------- */
const jsProp = (prop: string) => (prop.startsWith("--") ? JSON.stringify(prop) : prop.toLowerCase().replace(/^-ms-/, "ms-").replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()));
const jsVal = (v: string, important: boolean) => {
  const value = important ? `${v} !important` : v;
  return /^-?\d+(\.\d+)?$/.test(value) && !/^0\d/.test(value) ? value : JSON.stringify(value);
};

export function cssToJsObject(css: string): string {
  const trimmed = css.trim();
  const declsOnly = !/[{}]/.test(trimmed);
  const nodes = declsOnly ? parseCss(`x{${trimmed}}`)[0] : null;
  const objectOf = (list: CssNode[], depth: number): string => {
    const pad = "  ".repeat(depth + 1);
    const entries = list.flatMap(n => {
      if (n.type === "decl") return [`${pad}${jsProp(n.prop)}: ${jsVal(n.value, n.important)},`];
      if (n.type === "rule") return [`${pad}${JSON.stringify(n.selector)}: ${objectOf(n.children, depth + 1)},`];
      if (n.type === "at" && n.children) return [`${pad}${JSON.stringify(`@${n.name} ${n.prelude}`)}: ${objectOf(n.children, depth + 1)},`];
      return [];
    });
    return entries.length ? `{\n${entries.join("\n")}\n${"  ".repeat(depth)}}` : "{}";
  };
  if (nodes && nodes.type === "rule") return `const styles = ${objectOf(nodes.children, 0)};\n`;
  return `const styles = ${objectOf(parseCss(trimmed), 0)};\n`;
}
