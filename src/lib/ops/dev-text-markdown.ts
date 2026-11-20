// Markdown ⇄ HTML (CommonMark/GFM subset), Markdown table formatter and table-of-contents generator.
import { attr, decodeHtml, escapeHtmlText, isElement, parseHtml, textContent, type HElement, type HNode } from "./dev-text-html.ts";

/* ---------- HTML → Markdown ---------- */
const mdEscape = (text: string) => text.replace(/([\\`*_[\]])/g, "\\$1").replace(/^(#{1,6}\s|>|[-+]\s|\d+\.\s)/, "\\$1");

function inlineMd(nodes: HNode[]): string {
  return nodes.map(n => {
    if (n.type === "text") return mdEscape(decodeHtml(n.value).replace(/\s+/g, " "));
    if (n.type !== "element") return "";
    const tag = n.name.toLowerCase();
    const inner = () => inlineMd(n.children);
    switch (tag) {
      case "strong": case "b": { const t = inner().trim(); return t ? `**${t}**` : ""; }
      case "em": case "i": { const t = inner().trim(); return t ? `*${t}*` : ""; }
      case "del": case "s": case "strike": return `~~${inner()}~~`;
      case "code": { const t = textContent(n.children); const fence = t.includes("`") ? "``" : "`"; return `${fence}${t}${fence}`; }
      case "br": return "  \n";
      case "img": return `![${attr(n, "alt") ?? ""}](${attr(n, "src") ?? ""}${attr(n, "title") ? ` "${attr(n, "title")}"` : ""})`;
      case "a": {
        const href = attr(n, "href");
        const title = attr(n, "title");
        return href ? `[${inner()}](${href}${title ? ` "${title}"` : ""})` : inner();
      }
      case "script": case "style": return "";
      default: return inner();
    }
  }).join("");
}

function tableMd(table: HElement): string[] {
  const rows: HElement[] = [];
  const collect = (nodes: HNode[]) => nodes.forEach(n => {
    if (n.type === "element") {
      if (n.name.toLowerCase() === "tr") rows.push(n);
      else collect(n.children);
    }
  });
  collect(table.children);
  const cells = rows.map(r => r.children.filter((c): c is HElement => isElement(c, "td", "th")).map(c => inlineMd(c.children).trim().replace(/\|/g, "\\|")));
  if (!cells.length) return [];
  const width = Math.max(...cells.map(r => r.length));
  const pad = (r: string[]) => [...r, ...Array(width - r.length).fill("")];
  const [head, ...body] = cells.map(pad);
  return [`| ${head.join(" | ")} |`, `| ${head.map(() => "---").join(" | ")} |`, ...body.map(r => `| ${r.join(" | ")} |`)];
}

function blocksMd(nodes: HNode[], listDepth: number): string[] {
  const out: string[] = [];
  let inline: HNode[] = [];
  const flush = () => { const t = inlineMd(inline).trim(); if (t) out.push(t, ""); inline = []; };
  for (const n of nodes) {
    if (n.type !== "element") { if (n.type === "text") inline.push(n); continue; }
    const tag = n.name.toLowerCase();
    const heading = /^h([1-6])$/.exec(tag);
    if (heading) { flush(); out.push(`${"#".repeat(Number(heading[1]))} ${inlineMd(n.children).trim()}`, ""); continue; }
    if (tag === "p") { flush(); const t = inlineMd(n.children).trim(); if (t) out.push(t, ""); continue; }
    if (tag === "hr") { flush(); out.push("---", ""); continue; }
    if (tag === "pre") {
      flush();
      const code = n.children.find((c): c is HElement => isElement(c, "code"));
      const lang = (code && /language-([\w+-]+)/.exec(attr(code, "class") ?? "")?.[1]) ?? "";
      const text = textContent(code ? code.children : n.children).replace(/\n$/, "");
      out.push("```" + lang, text, "```", "");
      continue;
    }
    if (tag === "blockquote") { flush(); out.push(...blocksMd(n.children, listDepth).map(l => (l ? `> ${l}` : ">")).slice(0, -1), ""); continue; }
    if (tag === "ul" || tag === "ol") { flush(); out.push(...listMd(n, listDepth), ...(listDepth ? [] : [""])); continue; }
    if (tag === "table") { flush(); out.push(...tableMd(n), ""); continue; }
    if (["div", "section", "article", "main", "header", "footer", "nav", "aside", "body", "html", "figure", "figcaption"].includes(tag)) { flush(); out.push(...blocksMd(n.children, listDepth)); continue; }
    if (["head", "script", "style", "template"].includes(tag)) continue;
    inline.push(n);
  }
  flush();
  return out;
}

function listMd(list: HElement, depth: number): string[] {
  const ordered = list.name.toLowerCase() === "ol";
  const start = Number(attr(list, "start") ?? 1) || 1;
  const pad = "   ".repeat(depth);
  return list.children.filter((c): c is HElement => isElement(c, "li")).flatMap((li, i) => {
    const marker = ordered ? `${start + i}.` : "-";
    const inlineKids = li.children.filter(c => !isElement(c, "ul", "ol"));
    const nested = li.children.filter((c): c is HElement => isElement(c, "ul", "ol"));
    const text = blocksMd(inlineKids, depth + 1).filter(Boolean).join(" ");
    return [`${pad}${marker} ${text}`, ...nested.flatMap(n => listMd(n, depth + 1))];
  });
}

export function htmlToMarkdown(html: string): string {
  const lines = blocksMd(parseHtml(html), 0);
  const text = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!text) throw new Error("No convertible content found in that HTML.");
  return text + "\n";
}

/* ---------- Markdown → HTML ---------- */
/** Text here is already HTML-escaped, so only quotes still need escaping inside attributes. */
const q = (text: string) => text.replace(/"/g, "&quot;");
const safeUrl = (url: string) => (/^\s*(javascript|vbscript|data):/i.test(url) ? "#" : url);

export function inlineHtml(text: string): string {
  const codes: string[] = [];
  let s = text.replace(/(`+)([\s\S]*?[^`])\1(?!`)/g, (_, _f: string, code: string) => { codes.push(`<code>${escapeHtmlText(code.trim())}</code>`); return `\u0000${codes.length - 1}\u0000`; });
  s = escapeHtmlText(s).replace(/\\([\\`*_[\]{}()#+\-.!~|>])/g, (_, c: string) => `&#${c.charCodeAt(0)};`);
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^"]*?)&quot;|\s+"([^"]*?)")?\)/g, (_, alt: string, src: string, t1?: string, t2?: string) =>
    `<img src="${q(safeUrl(src))}" alt="${q(alt)}"${t1 ?? t2 ? ` title="${q(t1 ?? t2 ?? "")}"` : ""}>`);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*?)")?\)/g, (_, label: string, href: string, title?: string) =>
    `<a href="${q(safeUrl(href))}"${title ? ` title="${q(title)}"` : ""}>${label}</a>`);
  s = s.replace(/&lt;(https?:\/\/[^\s&]+)&gt;/g, (_, url: string) => `<a href="${url}">${url}</a>`);
  s = s.replace(/(\*\*|__)(?=\S)([\s\S]*?\S)\1/g, "<strong>$2</strong>");
  s = s.replace(/(^|[^\w*])\*(?=\S)([^*]*?\S)\*(?!\*)/g, "$1<em>$2</em>").replace(/(^|[^\w])_(?=\S)([^_]*?\S)_(?![\w])/g, "$1<em>$2</em>");
  s = s.replace(/~~(?=\S)([\s\S]*?\S)~~/g, "<del>$1</del>");
  s = s.replace(/( {2,}|\\)\n/g, "<br>\n");
  return s.replace(/\u0000(\d+)\u0000/g, (_, i: string) => codes[Number(i)]);
}

const splitRow = (line: string) => line.trim().replace(/^\||\|$/g, "").split(/(?<!\\)\|/).map(c => c.trim().replace(/\\\|/g, "|"));
const isTableSep = (line: string) => /^\s*\|?\s*:?-{1,}:?\s*(\|\s*:?-{1,}:?\s*)*\|?\s*$/.test(line) && line.includes("-");

function listBlock(lines: string[], start: number): { html: string; next: number } {
  const first = /^(\s*)([-*+]|\d+[.)])\s+/.exec(lines[start]) as RegExpExecArray;
  const baseIndent = first[1].length;
  const ordered = /\d/.test(first[2]);
  const items: string[][] = [];
  let i = start;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) { if (i + 1 < lines.length && /^(\s*)([-*+]|\d+[.)])\s+/.test(lines[i + 1]) && (/^\s*/.exec(lines[i + 1])?.[0].length ?? 0) >= baseIndent) continue; break; }
    const m = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line);
    const indent = /^\s*/.exec(line)?.[0].length ?? 0;
    if (m && indent === baseIndent && /\d/.test(m[2]) === ordered) { items.push([m[3]]); continue; }
    if (indent > baseIndent && items.length) { items[items.length - 1].push(line.slice(Math.min(indent, baseIndent + 2))); continue; }
    break;
  }
  const startNum = ordered ? parseInt(first[2], 10) : 1;
  const tag = ordered ? "ol" : "ul";
  const body = items.map(item => {
    const [head, ...rest] = item;
    const task = /^\[([ xX])\]\s+(.*)$/.exec(head);
    const label = task ? `<input type="checkbox" disabled${task[1] !== " " ? " checked" : ""}> ${inlineHtml(task[2])}` : inlineHtml(head);
    const nested = rest.length ? `\n${blocksHtml(rest.map(l => l.replace(/^ {1,2}/, "")))}` : "";
    return `<li>${label}${nested}</li>`;
  }).join("\n");
  return { html: `<${tag}${ordered && startNum !== 1 ? ` start="${startNum}"` : ""}>\n${body}\n</${tag}>`, next: i };
}

export function blocksHtml(lines: string[]): string {
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const fence = /^\s*(```+|~~~+)\s*([\w+#-]*)/.exec(line);
    if (fence) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(fence[1])) body.push(lines[i++]);
      i++;
      out.push(`<pre><code${fence[2] ? ` class="language-${fence[2]}"` : ""}>${escapeHtmlText(body.join("\n"))}\n</code></pre>`);
      continue;
    }
    const heading = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (heading) { out.push(`<h${heading[1].length}>${inlineHtml(heading[2])}</h${heading[1].length}>`); i++; continue; }
    if (/^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(line)) { out.push("<hr>"); i++; continue; }
    if (/^\s{0,3}>/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^\s{0,3}>/.test(lines[i])) quote.push(lines[i++].replace(/^\s{0,3}>\s?/, ""));
      out.push(`<blockquote>\n${blocksHtml(quote)}\n</blockquote>`);
      continue;
    }
    if (/^\s*([-*+]|\d+[.)])\s+/.test(line)) { const list = listBlock(lines, i); out.push(list.html); i = list.next; continue; }
    if (line.includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const head = splitRow(line);
      const aligns = splitRow(lines[i + 1]).map(c => (c.startsWith(":") && c.endsWith(":") ? "center" : c.endsWith(":") ? "right" : c.startsWith(":") ? "left" : ""));
      const cell = (tag: string, text: string, j: number) => `<${tag}${aligns[j] ? ` style="text-align: ${aligns[j]}"` : ""}>${inlineHtml(text)}</${tag}>`;
      i += 2;
      const rows: string[] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) rows.push(`<tr>${splitRow(lines[i++]).map((c, j) => cell("td", c, j)).join("")}</tr>`);
      out.push(`<table>\n<thead>\n<tr>${head.map((c, j) => cell("th", c, j)).join("")}</tr>\n</thead>${rows.length ? `\n<tbody>\n${rows.join("\n")}\n</tbody>` : ""}\n</table>`);
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^\s*(#{1,6}\s|>|```|~~~|([-*+]|\d+[.)])\s+)/.test(lines[i]) && !/^\s{0,3}([-*_])(\s*\1){2,}\s*$/.test(lines[i])) para.push(lines[i++]);
    if (i < lines.length && para.length && /^\s*(=+|-+)\s*$/.test(lines[i])) {
      const level = lines[i].trim().startsWith("=") ? 1 : 2;
      out.push(`<h${level}>${inlineHtml(para.join("\n"))}</h${level}>`);
      i++;
      continue;
    }
    if (!para.length) { para.push(lines[i++]); }
    out.push(`<p>${inlineHtml(para.map((l, k) => (k === para.length - 1 ? l.trim() : l.replace(/^\s+/, ""))).join("\n"))}</p>`);
  }
  return out.join("\n");
}

export function markdownToHtml(md: string): string {
  if (!md.trim()) throw new Error("Paste some Markdown first.");
  return blocksHtml(md.replace(/\r\n?/g, "\n").replace(/\t/g, "    ").split("\n")) + "\n";
}

/* ---------- Markdown table formatter ---------- */
const displayWidth = (text: string) => [...text].length;

export function formatMarkdownTables(md: string): string {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];
  let found = 0;
  for (let i = 0; i < lines.length; i++) {
    if (!(lines[i].includes("|") && i + 1 < lines.length && isTableSep(lines[i + 1]))) { out.push(lines[i]); continue; }
    const rows = [splitRow(lines[i])];
    const aligns = splitRow(lines[i + 1]).map(c => (c.startsWith(":") && c.endsWith(":") ? "c" : c.endsWith(":") ? "r" : c.startsWith(":") ? "l" : ""));
    let j = i + 2;
    while (j < lines.length && lines[j].includes("|") && lines[j].trim()) rows.push(splitRow(lines[j++]));
    const cols = Math.max(...rows.map(r => r.length), aligns.length);
    const esc = rows.map(r => Array.from({ length: cols }, (_, c) => (r[c] ?? "").replace(/\|/g, "\\|")));
    const widths = Array.from({ length: cols }, (_, c) => Math.max(3, ...esc.map(r => displayWidth(r[c]))));
    const padCell = (text: string, c: number) => {
      const gap = widths[c] - displayWidth(text);
      if (aligns[c] === "r") return " ".repeat(gap) + text;
      if (aligns[c] === "c") return " ".repeat(Math.floor(gap / 2)) + text + " ".repeat(Math.ceil(gap / 2));
      return text + " ".repeat(gap);
    };
    const sep = widths.map((w, c) => { const a = aligns[c]; return a === "c" ? `:${"-".repeat(w - 2)}:` : a === "r" ? `${"-".repeat(w - 1)}:` : a === "l" ? `:${"-".repeat(w - 1)}` : "-".repeat(w); });
    out.push(`| ${esc[0].map(padCell).join(" | ")} |`, `| ${sep.join(" | ")} |`, ...esc.slice(1).map(r => `| ${r.map(padCell).join(" | ")} |`));
    found++;
    i = j - 1;
  }
  if (!found) throw new Error("No Markdown table found. A table needs a header row and a separator row like | --- | --- |.");
  return out.join("\n");
}

/* ---------- table of contents ---------- */
export function slugifyHeading(text: string): string {
  return text.toLowerCase().replace(/<[^>]+>/g, "").replace(/[^\p{L}\p{N}\s_-]/gu, "").trim().replace(/\s/g, "-");
}

export function markdownToc(md: string, maxLevel: number, ordered: boolean): string {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const used = new Map<string, number>();
  let inFence = false;
  const items: string[] = [];
  const counters: number[] = [];
  let minLevel = 7;
  const headings: Array<[number, string]> = [];
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    const m = !inFence && /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (m && m[1].length <= maxLevel) { headings.push([m[1].length, m[2]]); minLevel = Math.min(minLevel, m[1].length); }
  }
  if (!headings.length) throw new Error("No # headings found in that Markdown.");
  for (const [level, raw] of headings) {
    const text = raw.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*_`]/g, "");
    const base = slugifyHeading(text);
    const n = used.get(base) ?? 0;
    used.set(base, n + 1);
    const depth = level - minLevel;
    counters.length = depth + 1;
    counters[depth] = (counters[depth] ?? 0) + 1;
    items.push(`${"   ".repeat(depth)}${ordered ? `${counters[depth]}.` : "-"} [${text}](#${n ? `${base}-${n}` : base})`);
  }
  return items.join("\n") + "\n";
}
