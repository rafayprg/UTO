// A forgiving HTML/SVG parser that builds a small tree. It keeps tag and attribute case (for SVG),
// knows void and raw-text elements, and closes p/li/td/tr/option/dt/dd implicitly like browsers do.
// It is not a full HTML5 tree builder: it does not insert missing <html>/<body>/<tbody> elements.

export type HNode =
  | { type: "element"; name: string; attrs: Array<[string, string | null]>; children: HNode[] }
  | { type: "text"; value: string }
  | { type: "comment"; value: string }
  | { type: "doctype"; value: string }; // raw "!DOCTYPE html" or "?xml …?"
export type HElement = Extract<HNode, { type: "element" }>;

export const VOID = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"]);
const RAW = new Set(["script", "style", "textarea", "title"]);
const IMPLIED_CLOSE: Record<string, string[]> = {
  p: ["p"], li: ["li"], dt: ["dt", "dd"], dd: ["dt", "dd"], tr: ["tr", "td", "th"], td: ["td", "th"], th: ["td", "th"], option: ["option"],
};
const BLOCK_CLOSES_P = new Set(["address", "article", "aside", "blockquote", "div", "dl", "fieldset", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hr", "main", "nav", "ol", "p", "pre", "section", "table", "ul"]);
export const BLOCK = new Set([...BLOCK_CLOSES_P, "html", "head", "body", "li", "dd", "dt", "tr", "td", "th", "thead", "tbody", "tfoot", "caption", "figure", "figcaption", "details", "summary", "option", "select", "title", "meta", "link", "script", "style", "br", "svg", "g", "defs", "path", "circle", "rect", "line", "polyline", "polygon", "ellipse"]);

function readAttrs(src: string): Array<[string, string | null]> {
  const attrs: Array<[string, string | null]> = [];
  const re = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) attrs.push([m[1], m[2] ?? m[3] ?? m[4] ?? null]);
  return attrs;
}

export function parseHtml(input: string): HNode[] {
  const root: HElement = { type: "element", name: "#root", attrs: [], children: [] };
  const stack: HElement[] = [root];
  const top = () => stack[stack.length - 1];
  const lower = (n: string) => n.toLowerCase();
  const closeTo = (name: string) => {
    const idx = stack.map(e => lower(e.name)).lastIndexOf(lower(name));
    if (idx > 0) stack.length = idx;
  };
  let pos = 0;
  const src = input.replace(/^﻿/, "");
  while (pos < src.length) {
    const lt = src.indexOf("<", pos);
    if (lt < 0) { top().children.push({ type: "text", value: src.slice(pos) }); break; }
    if (lt > pos) top().children.push({ type: "text", value: src.slice(pos, lt) });
    pos = lt;
    if (src.startsWith("<!--", pos)) {
      const end = src.indexOf("-->", pos + 4);
      const stop = end < 0 ? src.length : end;
      top().children.push({ type: "comment", value: src.slice(pos + 4, stop) });
      pos = end < 0 ? src.length : end + 3;
      continue;
    }
    if (/^<![A-Za-z]/.test(src.slice(pos, pos + 3)) || src.startsWith("<?", pos)) {
      const end = src.indexOf(">", pos);
      top().children.push({ type: "doctype", value: src.slice(pos + 1, end < 0 ? src.length : end) });
      pos = end < 0 ? src.length : end + 1;
      continue;
    }
    const close = /^<\/([A-Za-z][\w:.-]*)\s*>/.exec(src.slice(pos));
    if (close) { closeTo(close[1]); pos += close[0].length; continue; }
    const open = /^<([A-Za-z][\w:.-]*)((?:\s+[^\s"'<>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*(\/?)>/.exec(src.slice(pos));
    if (!open) { top().children.push({ type: "text", value: "<" }); pos++; continue; }
    pos += open[0].length;
    const name = open[1];
    const key = lower(name);
    const implied = IMPLIED_CLOSE[key] ?? [];
    if (implied.includes(lower(top().name))) stack.pop();
    if (BLOCK_CLOSES_P.has(key) && lower(top().name) === "p") stack.pop();
    const el: HElement = { type: "element", name, attrs: readAttrs(open[2]), children: [] };
    top().children.push(el);
    if (open[3] === "/" || VOID.has(key)) continue;
    if (RAW.has(key)) {
      const endRe = new RegExp(`</${key}\\s*>`, "i");
      const rest = src.slice(pos);
      const m = endRe.exec(rest);
      const content = m ? rest.slice(0, m.index) : rest;
      if (content) el.children.push({ type: "text", value: content });
      pos += m ? m.index + m[0].length : rest.length;
      continue;
    }
    stack.push(el);
  }
  return root.children;
}

const NAMED: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", copy: "©", reg: "®", trade: "™", hellip: "…", mdash: "—", ndash: "–",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”", bull: "•", middot: "·", deg: "°", euro: "€", pound: "£", yen: "¥", cent: "¢", times: "×", divide: "÷",
  laquo: "«", raquo: "»", sect: "§", para: "¶", plusmn: "±", frac12: "½", frac14: "¼", frac34: "¾", larr: "←", rarr: "→", uarr: "↑", darr: "↓",
};

export function decodeHtml(text: string): string {
  return text.replace(/&(#x[0-9a-fA-F]+|#\d+|[A-Za-z][A-Za-z0-9]*);/g, (whole, name: string) => {
    if (name.startsWith("#")) {
      const code = name[1] === "x" || name[1] === "X" ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : whole;
    }
    return NAMED[name] ?? whole;
  });
}

export const escapeHtmlText = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const escapeHtmlAttr = (text: string) => text.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

export function attr(el: HElement, name: string): string | null | undefined {
  const found = el.attrs.find(([k]) => k.toLowerCase() === name.toLowerCase());
  return found ? found[1] : undefined;
}

export const isElement = (n: HNode, ...names: string[]): n is HElement =>
  n.type === "element" && (!names.length || names.includes(n.name.toLowerCase()));

export function textContent(nodes: HNode[]): string {
  return nodes.map(n => (n.type === "text" ? decodeHtml(n.value) : n.type === "element" ? textContent(n.children) : "")).join("");
}

/** Serialises attributes with double quotes; boolean attributes stay bare. */
export function attrsText(el: HElement): string {
  return el.attrs.map(([k, v]) => (v === null ? ` ${k}` : ` ${k}="${v.replace(/"/g, "&quot;")}"`)).join("");
}

export function serializeHtml(nodes: HNode[]): string {
  return nodes.map(n => {
    if (n.type === "text") return n.value;
    if (n.type === "comment") return `<!--${n.value}-->`;
    if (n.type === "doctype") return `<${n.value}>`;
    if (VOID.has(n.name.toLowerCase())) return `<${n.name}${attrsText(n)}>`;
    return `<${n.name}${attrsText(n)}>${serializeHtml(n.children)}</${n.name}>`;
  }).join("");
}
