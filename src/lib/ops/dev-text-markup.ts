// HTML/SVG → JSX, React components, React Native SVG and Pug; HTML formatter, minifier and plain text.
import { BLOCK, VOID, attr, attrsText, decodeHtml, isElement, parseHtml, type HElement, type HNode } from "./dev-text-html.ts";

const JSX_RENAMES: Record<string, string> = {
  class: "className", for: "htmlFor", tabindex: "tabIndex", readonly: "readOnly", maxlength: "maxLength", minlength: "minLength",
  colspan: "colSpan", rowspan: "rowSpan", contenteditable: "contentEditable", crossorigin: "crossOrigin", datetime: "dateTime",
  enctype: "encType", formaction: "formAction", frameborder: "frameBorder", autocomplete: "autoComplete", autofocus: "autoFocus",
  autoplay: "autoPlay", novalidate: "noValidate", "accept-charset": "acceptCharset", "http-equiv": "httpEquiv", srcset: "srcSet",
  usemap: "useMap", spellcheck: "spellCheck", playsinline: "playsInline", allowfullscreen: "allowFullScreen", referrerpolicy: "referrerPolicy",
  inputmode: "inputMode", charset: "charSet", cellpadding: "cellPadding", cellspacing: "cellSpacing", hreflang: "hrefLang",
  accesskey: "accessKey", enterkeyhint: "enterKeyHint", itemprop: "itemProp", itemscope: "itemScope", itemtype: "itemType",
  marginheight: "marginHeight", marginwidth: "marginWidth", srcdoc: "srcDoc", srclang: "srcLang", viewbox: "viewBox",
  "xlink:href": "xlinkHref", "xml:space": "xmlSpace", "xml:lang": "xmlLang", "xmlns:xlink": "xmlnsXlink",
};

const camelize = (name: string) => name.replace(/[-:]([a-z])/g, (_, c: string) => c.toUpperCase());

function jsxAttrName(name: string): string {
  const lower = name.toLowerCase();
  if (JSX_RENAMES[lower]) return JSX_RENAMES[lower];
  if (lower.startsWith("data-") || lower.startsWith("aria-")) return lower;
  if (/^on[a-z]+$/.test(lower)) return `on${lower.charAt(2).toUpperCase()}${lower.slice(3)}`;
  return name.includes("-") || name.includes(":") ? camelize(name) : name;
}

export function styleToObject(css: string): Array<[string, string]> {
  return css.split(";").map(decl => decl.trim()).filter(Boolean).flatMap(decl => {
    const colon = decl.indexOf(":");
    if (colon < 0) return [];
    const prop = decl.slice(0, colon).trim();
    const value = decl.slice(colon + 1).trim();
    if (prop.startsWith("--")) return [[JSON.stringify(prop), value] as [string, string]];
    const key = prop.toLowerCase().replace(/^-ms-/, "ms-").replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    return [[key, value] as [string, string]];
  });
}

const styleLiteral = (css: string) => {
  const pairs = styleToObject(css).map(([k, v]) => `${k}: ${/^-?\d+(\.\d+)?$/.test(v) && !/^0\d/.test(v) ? v : JSON.stringify(v)}`);
  return `{{ ${pairs.join(", ")} }}`;
};

interface JsxOptions { tag: (name: string) => string | null; attrs: (el: HElement) => Array<[string, string | null]> }

function jsxAttrs(el: HElement, opts: JsxOptions): string {
  const form = ["input", "textarea", "select"].includes(el.name.toLowerCase());
  return opts.attrs(el).map(([rawName, value]) => {
    let name = jsxAttrName(rawName);
    if (form && name === "value") name = "defaultValue";
    if (form && name === "checked") name = "defaultChecked";
    if (name === "style" && value !== null) return ` style=${styleLiteral(value)}`;
    if (/^on[A-Z]/.test(name) && value !== null) return ` ${name}={(event) => { ${value.trim().replace(/;?$/, ";")} }}`;
    if (value === null) return ` ${name}`;
    return value.includes('"') ? ` ${name}={${JSON.stringify(decodeHtml(value))}}` : ` ${name}="${value}"`;
  }).join("");
}

const jsxText = (text: string) => text.replace(/[{}]/g, ch => `{"${ch}"}`).replace(/</g, "&lt;").replace(/>/g, "&gt;");
const hasInlineText = (children: HNode[]) => children.some(c => c.type === "text" && c.value.trim());

function jsxInline(node: HNode, opts: JsxOptions): string {
  if (node.type === "text") return jsxText(node.value.replace(/\s+/g, " "));
  if (node.type === "comment") return `{/*${node.value.replace(/\*\//g, "* /")}*/}`;
  if (node.type === "doctype") return "";
  const tag = opts.tag(node.name);
  if (tag === null) return "";
  const raw = ["script", "style"].includes(node.name.toLowerCase());
  const inner = raw ? `{\`${node.children.map(c => (c.type === "text" ? c.value : "")).join("").replace(/[`\\]/g, "\\$&").replace(/\$\{/g, "\\${")}\`}` : node.children.map(c => jsxInline(c, opts)).join("");
  return inner ? `<${tag}${jsxAttrs(node, opts)}>${inner}</${tag}>` : `<${tag}${jsxAttrs(node, opts)} />`;
}

function jsxLines(node: HNode, depth: number, opts: JsxOptions): string[] {
  const pad = "  ".repeat(depth);
  if (node.type === "text") { const t = node.value.trim().replace(/\s+/g, " "); return t ? [pad + jsxText(t)] : []; }
  if (node.type !== "element") { const s = jsxInline(node, opts); return s ? [pad + s] : []; }
  const tag = opts.tag(node.name);
  if (tag === null) return [];
  const kids = node.children.filter(c => !(c.type === "text" && !c.value.trim()) && c.type !== "doctype");
  if (!kids.length || hasInlineText(node.children) || ["script", "style", "pre", "textarea"].includes(node.name.toLowerCase())) return [pad + jsxInline(node, opts)];
  return [`${pad}<${tag}${jsxAttrs(node, opts)}>`, ...kids.flatMap(k => jsxLines(k, depth + 1, opts)), `${pad}</${tag}>`];
}

function renderJsx(nodes: HNode[], depth: number, opts: JsxOptions): string {
  const top = nodes.filter(n => !(n.type === "text" && !n.value.trim()) && n.type !== "doctype");
  if (!top.length) throw new Error("Paste some HTML or SVG markup first.");
  const elementCount = top.filter(n => n.type === "element").length;
  if (top.length === 1 || (elementCount === 1 && top.every(n => n.type !== "text"))) {
    const lines = top.flatMap(n => jsxLines(n, depth, opts));
    return lines.join("\n");
  }
  const pad = "  ".repeat(depth);
  return [`${pad}<>`, ...top.flatMap(n => jsxLines(n, depth + 1, opts)), `${pad}</>`].join("\n");
}

const plainOpts: JsxOptions = { tag: name => name, attrs: el => el.attrs };

export function htmlToJsx(html: string, component: string): string {
  const nodes = parseHtml(html).filter(n => n.type !== "doctype");
  if (!component) return renderJsx(nodes, 0, plainOpts) + "\n";
  return `export function ${component}() {\n  return (\n${renderJsx(nodes, 2, plainOpts)}\n  );\n}\n`;
}

/* ---------- SVG ---------- */
const EDITOR_PREFIX = /^(inkscape|sodipodi|sketch|serif|figma|dc|cc|rdf|i|x|graph):/i;

function svgRoot(svg: string): HElement {
  const nodes = parseHtml(svg);
  const root = nodes.find((n): n is HElement => isElement(n, "svg"));
  if (!root) throw new Error("No <svg> element found. Paste the full SVG markup.");
  return root;
}

const svgAttrs = (el: HElement) => el.attrs.filter(([k]) => !EDITOR_PREFIX.test(k) && !/^xmlns:(inkscape|sodipodi|sketch|serif|figma|dc|cc|rdf)$/i.test(k));

export function svgToJsx(svg: string, spreadProps: boolean): string {
  const root = svgRoot(svg);
  const opts: JsxOptions = {
    tag: name => (EDITOR_PREFIX.test(name) || name.toLowerCase() === "metadata" ? null : name),
    attrs: el => (spreadProps && el === root ? [...svgAttrs(el), ["{...props}", null]] : svgAttrs(el)),
  };
  return renderJsx([root], 0, opts).replace(/ \{\.\.\.props\}(?=[ >/])/, " {...props}");
}

export function svgToComponent(svg: string, name: string, typescript: boolean): string {
  const jsx = svgToJsx(svg, true).split("\n").map(line => `    ${line}`).join("\n");
  const props = typescript ? "props: SVGProps<SVGSVGElement>" : "props";
  const head = typescript ? 'import type { SVGProps } from "react";\n\n' : "";
  return `${head}export function ${name}(${props}) {\n  return (\n${jsx}\n  );\n}\n`;
}

const RN_TAGS: Record<string, string> = {
  svg: "Svg", path: "Path", circle: "Circle", rect: "Rect", g: "G", line: "Line", polyline: "Polyline", polygon: "Polygon",
  ellipse: "Ellipse", text: "Text", tspan: "TSpan", defs: "Defs", lineargradient: "LinearGradient", radialgradient: "RadialGradient",
  stop: "Stop", clippath: "ClipPath", use: "Use", symbol: "Symbol", mask: "Mask", pattern: "Pattern", image: "Image", textpath: "TextPath",
};

export function svgToReactNative(svg: string, name: string): string {
  const root = svgRoot(svg);
  const used = new Set<string>();
  const opts: JsxOptions = {
    tag: tag => { const rn = RN_TAGS[tag.toLowerCase()]; if (rn) used.add(rn); return rn ?? null; },
    attrs: el => {
      const kept = svgAttrs(el).filter(([k]) => !/^(class|style|xmlns(:\w+)?|version|xml:space)$/i.test(k));
      return el === root ? [...kept, ["{...props}", null]] : kept;
    },
  };
  const body = renderJsx([root], 2, opts);
  const names = [...used].filter(n => n !== "Svg").sort();
  const imports = `import Svg${names.length ? `, { ${names.join(", ")} }` : ""} from "react-native-svg";\nimport type { SvgProps } from "react-native-svg";`;
  return `${imports}\n\nexport function ${name}(props: SvgProps) {\n  return (\n${body}\n  );\n}\n`;
}

/* ---------- SVG optimiser (basic) ---------- */
const NUMERIC_ATTRS = /^(d|points|x|y|x1|x2|y1|y2|cx|cy|r|rx|ry|width|height|transform|viewBox|stroke-width|offset|dx|dy)$/i;

export function optimizeSvg(svg: string, decimals: number, keepTitle: boolean): string {
  const root = svgRoot(svg);
  const round = (value: string) => value.replace(/-?\d*\.\d+(?:e[-+]?\d+)?/gi, n => String(Number(Number(n).toFixed(decimals))));
  const clean = (el: HElement): HElement => ({
    ...el,
    attrs: svgAttrs(el).filter(([k, v]) => !(k.toLowerCase() === "id" && v === "")).map(([k, v]) => [k, v !== null && NUMERIC_ATTRS.test(k) ? round(v).replace(/\s+/g, " ").trim() : v]),
    children: el.children.flatMap((c): HNode[] => {
      if (c.type === "comment" || c.type === "doctype") return [];
      if (c.type === "text") return c.value.trim() ? [{ type: "text", value: c.value.replace(/\s+/g, " ") }] : [];
      const lower = c.name.toLowerCase();
      if (EDITOR_PREFIX.test(c.name) || lower === "metadata" || (!keepTitle && (lower === "title" || lower === "desc"))) return [];
      const child = clean(c);
      if (lower === "g" && !child.attrs.length && !child.children.length) return [];
      return [child];
    }),
  });
  const out = (n: HNode): string => {
    if (n.type === "text") return n.value;
    if (n.type !== "element") return "";
    const inner = n.children.map(out).join("");
    return inner ? `<${n.name}${attrsText(n)}>${inner}</${n.name}>` : `<${n.name}${attrsText(n)}/>`;
  };
  return out(clean(root));
}

/* ---------- Pug ---------- */
function pugAttrs(el: HElement): string {
  const rest = el.attrs.filter(([k]) => k !== "id" && k !== "class");
  return rest.length ? `(${rest.map(([k, v]) => (v === null ? k : `${k}=${JSON.stringify(decodeHtml(v))}`)).join(", ")})` : "";
}
function pugHead(el: HElement): string {
  const id = attr(el, "id");
  const classes = (attr(el, "class") ?? "").split(/\s+/).filter(Boolean);
  const safe = classes.every(c => /^[\w-]+$/.test(c));
  const shorthand = `${id && /^[\w-]+$/.test(id) ? `#${id}` : ""}${safe ? classes.map(c => `.${c}`).join("") : ""}`;
  const extra = el.attrs.filter(([k]) => (k === "id" && !(id && /^[\w-]+$/.test(id))) || (k === "class" && !safe));
  const tag = el.name.toLowerCase() === "div" && shorthand ? "" : el.name;
  const attrs = pugAttrs(el);
  const extraText = extra.length ? `(${extra.map(([k, v]) => `${k}=${JSON.stringify(v ?? "")}`).join(", ")})` : "";
  return `${tag}${shorthand}${attrs && extraText ? attrs.slice(0, -1) + ", " + extraText.slice(1) : attrs || extraText}`;
}

function pugLines(node: HNode, depth: number): string[] {
  const pad = "  ".repeat(depth);
  if (node.type === "text") return node.value.trim() ? node.value.trim().split("\n").map(line => `${pad}| ${line.trim()}`) : [];
  if (node.type === "comment") return [`${pad}//${node.value.replace(/\n/g, " ")}`];
  if (node.type === "doctype") return /^!doctype/i.test(node.value) ? [`${pad}doctype ${node.value.slice(9).trim() || "html"}`] : [];
  const head = pad + pugHead(node);
  const lower = node.name.toLowerCase();
  if (["script", "style", "pre", "textarea"].includes(lower)) {
    const raw = node.children.map(c => (c.type === "text" ? c.value : "")).join("");
    return raw.trim() ? [`${head}.`, ...raw.replace(/^\n+|\s+$/g, "").split("\n").map(line => `${pad}  ${line}`)] : [head];
  }
  const kids = node.children.filter(c => !(c.type === "text" && !c.value.trim()));
  if (kids.length === 1 && kids[0].type === "text" && !kids[0].value.trim().includes("\n")) return [`${head} ${kids[0].value.trim()}`];
  return [head, ...kids.flatMap(k => pugLines(k, depth + 1))];
}

export function htmlToPug(html: string): string {
  const lines = parseHtml(html).flatMap(n => pugLines(n, 0));
  if (!lines.length) throw new Error("Paste some HTML first.");
  return lines.join("\n") + "\n";
}

/* ---------- HTML formatter and minifier ---------- */
const PRESERVE = new Set(["pre", "textarea", "script", "style"]);
const isInlineNode = (n: HNode) => n.type === "text" || (n.type === "element" && !BLOCK.has(n.name.toLowerCase()));

function formatLines(node: HNode, depth: number, unit: string): string[] {
  const pad = unit.repeat(depth);
  if (node.type === "text") { const t = node.value.replace(/\s+/g, " ").trim(); return t ? [pad + t] : []; }
  if (node.type === "comment") return [`${pad}<!--${node.value}-->`];
  if (node.type === "doctype") return [`${pad}<${node.value}>`];
  const lower = node.name.toLowerCase();
  const open = `<${node.name}${attrsText(node)}>`;
  if (VOID.has(lower)) return [pad + open];
  if (PRESERVE.has(lower)) {
    const raw = node.children.map(c => (c.type === "text" ? c.value : "")).join("");
    if (lower === "pre" || lower === "textarea" || !raw.trim()) return [`${pad}${open}${lower === "pre" ? serializeInline(node.children) : raw}</${node.name}>`];
    const body = raw.replace(/^\s*\n/, "").replace(/\s+$/, "");
    const lines = body.split("\n");
    const common = Math.min(...lines.filter(l => l.trim()).map(l => /^\s*/.exec(l)?.[0].length ?? 0));
    return [pad + open, ...lines.map(l => (l.trim() ? pad + unit + l.slice(common) : "")), `${pad}</${node.name}>`];
  }
  const kids = node.children.filter(c => !(c.type === "text" && !c.value.trim()));
  if (!kids.length) return [`${pad}${open}</${node.name}>`];
  if (node.children.every(isInlineNode) && hasInlineText(node.children)) return [`${pad}${open}${serializeInline(node.children).replace(/\s+/g, " ").trim()}</${node.name}>`];
  return [pad + open, ...kids.flatMap(k => formatLines(k, depth + 1, unit)), `${pad}</${node.name}>`];
}

function serializeInline(nodes: HNode[]): string {
  return nodes.map(n => {
    if (n.type === "text") return n.value;
    if (n.type === "comment") return `<!--${n.value}-->`;
    if (n.type === "doctype") return `<${n.value}>`;
    return VOID.has(n.name.toLowerCase()) ? `<${n.name}${attrsText(n)}>` : `<${n.name}${attrsText(n)}>${serializeInline(n.children)}</${n.name}>`;
  }).join("");
}

export function formatHtml(html: string, unit: string): string {
  const lines = parseHtml(html).flatMap(n => formatLines(n, 0, unit));
  if (!lines.length) throw new Error("Paste some HTML first.");
  return lines.join("\n") + "\n";
}

export function minifyHtml(html: string, keepComments: boolean): string {
  const walk = (nodes: HNode[], parentPreserves: boolean): HNode[] => nodes.flatMap((n, i): HNode[] => {
    if (n.type === "comment") return keepComments || n.value.startsWith("[if") ? [n] : [];
    if (n.type === "doctype") return [n];
    if (n.type === "text") {
      if (parentPreserves) return [n];
      const collapsed = n.value.replace(/\s+/g, " ");
      if (collapsed === " ") {
        const prev = nodes[i - 1], next = nodes[i + 1];
        const blockish = (x: HNode | undefined) => !x || (x.type === "element" && BLOCK.has(x.name.toLowerCase())) || x.type === "comment" || x.type === "doctype";
        if (blockish(prev) || blockish(next)) return [];
      }
      return [{ type: "text", value: collapsed }];
    }
    return [{ ...n, children: walk(n.children, parentPreserves || PRESERVE.has(n.name.toLowerCase())) }];
  });
  return serializeInline(walk(parseHtml(html), false)).trim();
}

/* ---------- HTML → plain text ---------- */
export function htmlToText(html: string): string {
  const out: string[] = [];
  const walk = (nodes: HNode[], listDepth: number) => {
    for (const n of nodes) {
      if (n.type === "text") { out.push(decodeHtml(n.value).replace(/\s+/g, " ")); continue; }
      if (n.type !== "element") continue;
      const lower = n.name.toLowerCase();
      if (["script", "style", "head", "template", "noscript"].includes(lower)) continue;
      if (lower === "br") { out.push("\n"); continue; }
      if (lower === "li") { out.push(`\n${"  ".repeat(Math.max(0, listDepth - 1))}- `); walk(n.children, listDepth); continue; }
      const block = BLOCK.has(lower);
      if (block) out.push("\n");
      walk(n.children, lower === "ul" || lower === "ol" ? listDepth + 1 : listDepth);
      if (lower === "td" || lower === "th") out.push("\t");
      if (block) out.push("\n");
    }
  };
  walk(parseHtml(html), 0);
  const text = out.join("").split("\n").map(line => line.replace(/[ \t]+$/g, "").replace(/^ +(?!-)/, "")).join("\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!text) throw new Error("No visible text was found in that HTML.");
  return text + "\n";
}
