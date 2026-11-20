// Meta tags, robots.txt, sitemaps, hreflang, UTM and redirects. Self-contained.
import type { OptionField, OptionValues, TextOp } from "./types";

const text = (id: string, label: string, def = "", hint?: string): OptionField => ({ id, label, type: "text", default: def, ...(hint ? { hint } : {}) });
const str = (o: OptionValues, id: string) => String(o[id] ?? "").trim();
const lines = (input: string) => input.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
const chars = (value: string) => [...value].length;

export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeXml(value: string): string {
  return escapeHtml(value).replace(/'/g, "&apos;");
}

function absoluteUrl(value: string, label = "URL"): URL {
  try {
    const parsed = new URL(value.trim());
    if (!/^https?:$/.test(parsed.protocol)) throw new Error("bad");
    return parsed;
  } catch { throw new Error(`${label} must be a full URL starting with https:// (got "${value.trim().slice(0, 80)}").`); }
}

const meta = (attr: "name" | "property", key: string, value: string) => (value ? `<meta ${attr}="${key}" content="${escapeHtml(value)}">` : "");

/** Rough pixel width estimate for an Arial-like font. Only an approximation. */
function approxWidth(value: string, fontPx: number): number {
  let em = 0;
  for (const ch of value) {
    if (/[iljI.,:;'|!]/.test(ch)) em += 0.26;
    else if (ch === " ") em += 0.28;
    else if (/[mwMW]/.test(ch)) em += 0.85;
    else if (/[A-Z]/.test(ch)) em += 0.68;
    else if (/[a-z0-9]/.test(ch)) em += 0.53;
    else em += 0.6;
  }
  return Math.round(em * fontPx);
}

function cut(value: string, max: number): string {
  const all = [...value];
  return all.length <= max ? value : `${all.slice(0, max - 1).join("").trimEnd()}…`;
}

// --- robots.txt matching (Google's documented rules: longest match wins, Allow wins ties, * and $ wildcards)
interface Group { agents: string[]; rules: Array<{ allow: boolean; path: string }> }

function parseRobots(input: string): Group[] {
  const groups: Group[] = [];
  let current: Group | null = null;
  let lastWasAgent = false;
  for (const raw of input.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key === "user-agent") {
      if (!current || !lastWasAgent) { current = { agents: [], rules: [] }; groups.push(current); }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else {
      lastWasAgent = false;
      if (current && (key === "allow" || key === "disallow") && value) current.rules.push({ allow: key === "allow", path: value });
    }
  }
  return groups;
}

function ruleRegex(path: string): RegExp {
  const anchored = path.endsWith("$");
  const body = (anchored ? path.slice(0, -1) : path).split("*").map(part => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*");
  return new RegExp(`^${body}${anchored ? "$" : ""}`);
}

export function robotsVerdict(robots: string, agent: string, path: string): { allowed: boolean; rule: string; group: string } {
  const groups = parseRobots(robots);
  const ua = agent.toLowerCase();
  const named = groups.filter(g => g.agents.some(a => a !== "*" && ua.includes(a)));
  const best = named.length ? Math.max(...named.flatMap(g => g.agents.filter(a => ua.includes(a)).map(a => a.length))) : 0;
  const chosen = named.length ? named.filter(g => g.agents.some(a => ua.includes(a) && a.length === best)) : groups.filter(g => g.agents.includes("*"));
  const rules = chosen.flatMap(g => g.rules);
  let winner: { allow: boolean; path: string } | null = null;
  for (const rule of rules) {
    if (!ruleRegex(rule.path).test(path)) continue;
    if (!winner || rule.path.length > winner.path.length || (rule.path.length === winner.path.length && rule.allow)) winner = rule;
  }
  const group = chosen.length ? chosen.flatMap(g => g.agents).join(", ") : "(none — no matching group)";
  return { allowed: winner ? winner.allow : true, rule: winner ? `${winner.allow ? "Allow" : "Disallow"}: ${winner.path}` : "(no rule matched)", group };
}

// --- HTML scanning helpers (regex based; good for pasted page source, not a full HTML parser)
function attr(tag: string, name: string): string | null {
  const m = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(tag);
  return m ? (m[2] ?? m[3] ?? m[4] ?? "") : null;
}

function decode(value: string): string {
  return value.replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (_, e: string) => ({ amp: "&", lt: "<", gt: ">", quot: "\"", "#39": "'", apos: "'", nbsp: " " })[e] ?? _)
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)));
}

function innerText(html: string): string {
  return decode(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function stripScripts(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, "").replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1>/gi, "");
}

const SAMPLE_HTML = `<html><head>
<title>Video Trimmer – Cut Videos Online in Your Browser</title>
<meta name="description" content="Trim the start and end of a video without uploading it. Free, private and fast.">
<link rel="canonical" href="https://example.com/tools/video-trimmer">
<meta property="og:title" content="Video Trimmer">
</head><body>
<h1>Video Trimmer</h1>
<h3>How it works</h3>
<img src="/img/step1.png" alt="Dropping a video onto the page">
<img src="/img/step2.png">
<h2>FAQ</h2>
<a href="/tools/">All tools</a> <a href="https://github.com/example" rel="nofollow noopener">Source</a>
</body></html>`;

export const tagOps: Record<string, TextOp> = {
  "serp-snippet-preview": {
    input: { label: "Page title", example: "Video Trimmer – Cut Videos Online in Your Browser | Example Tools", rows: 2 },
    second: { label: "Meta description", example: "Trim the start and end of a video without uploading it. Everything runs in your browser, so your files stay private. Free, with no watermark and no sign-up." },
    options: [text("url", "Page URL", "https://example.com/tools/video-trimmer")],
    outputLabel: "Search result preview",
    note: "Google does not publish fixed limits and may rewrite titles and snippets. The character guides and pixel widths here are approximate.",
    run(input, o, second) {
      const title = input.replace(/\s+/g, " ").trim();
      const description = (second ?? "").replace(/\s+/g, " ").trim();
      if (!title) throw new Error("Enter a page title.");
      const page = absoluteUrl(str(o, "url"), "Page URL");
      const crumbs = [page.hostname, ...page.pathname.split("/").filter(Boolean)].join(" › ");
      const tw = approxWidth(title, 20);
      const warnings = [
        chars(title) > 60 ? `Title is ${chars(title)} characters; titles over about 60 characters (~600 px) are often cut.` : "",
        !description ? "No meta description: Google will pick text from the page." : chars(description) > 160 ? `Description is ${chars(description)} characters; snippets are often cut around 150–160.` : chars(description) < 70 ? "Description is short; consider 70–160 characters." : "",
      ].filter(Boolean);
      return [
        crumbs, cut(title, 61), description ? cut(description, 158) : "(no description)", "",
        `Title: ${chars(title)} characters, about ${tw} px at 20 px Arial (approximate)`,
        `Description: ${chars(description)} characters`,
        ...(warnings.length ? ["", ...warnings.map(w => `⚠ ${w}`)] : ["", "Lengths look fine."]),
      ].join("\n");
    },
  },
  "open-graph-generator": {
    input: false,
    options: [
      text("title", "Title", "Video Trimmer – Cut Videos in Your Browser"), text("description", "Description", "Trim videos privately without uploading them."),
      text("url", "Page URL", "https://example.com/tools/video-trimmer"), text("image", "Image URL (1200 × 630 is common)", "https://example.com/og/video-trimmer.png"), text("alt", "Image alt text", "Screenshot of the video trimmer"),
      { id: "type", label: "Type", type: "select", choices: [["website", "website"], ["article", "article"], ["product", "product"], ["video.other", "video.other"], ["profile", "profile"]], default: "website" },
      text("site", "Site name", "Example Tools"), text("locale", "Locale", "en_US"),
    ],
    outputLabel: "Open Graph meta tags", outputExt: "html",
    run(_, o) {
      absoluteUrl(str(o, "url"), "Page URL");
      if (str(o, "image")) absoluteUrl(str(o, "image"), "Image URL");
      if (!str(o, "title")) throw new Error("Enter a title.");
      return [meta("property", "og:title", str(o, "title")), meta("property", "og:description", str(o, "description")), meta("property", "og:type", str(o, "type")), meta("property", "og:url", str(o, "url")),
        meta("property", "og:image", str(o, "image")), meta("property", "og:image:alt", str(o, "alt")), meta("property", "og:site_name", str(o, "site")), meta("property", "og:locale", str(o, "locale"))].filter(Boolean).join("\n");
    },
  },
  "twitter-card-generator": {
    input: false,
    options: [
      { id: "card", label: "Card type", type: "select", choices: [["summary_large_image", "Summary with large image"], ["summary", "Summary"]], default: "summary_large_image" },
      text("title", "Title", "Video Trimmer – Cut Videos in Your Browser"), text("description", "Description", "Trim videos privately without uploading them."),
      text("image", "Image URL", "https://example.com/og/video-trimmer.png"), text("alt", "Image alt text", "Screenshot of the video trimmer"),
      text("site", "Site account (@handle, optional)", "@example"), text("creator", "Author account (@handle, optional)", ""),
    ],
    outputLabel: "Twitter / X card meta tags", outputExt: "html",
    run(_, o) {
      if (!str(o, "title")) throw new Error("Enter a title.");
      if (str(o, "image")) absoluteUrl(str(o, "image"), "Image URL");
      const handle = (v: string) => (v && !v.startsWith("@") ? `@${v}` : v);
      return [meta("name", "twitter:card", str(o, "card")), meta("name", "twitter:title", str(o, "title")), meta("name", "twitter:description", str(o, "description")), meta("name", "twitter:image", str(o, "image")),
        meta("name", "twitter:image:alt", str(o, "alt")), meta("name", "twitter:site", handle(str(o, "site"))), meta("name", "twitter:creator", handle(str(o, "creator")))].filter(Boolean).join("\n");
    },
  },
  "meta-tag-generator": {
    input: false,
    options: [
      text("title", "Page title", "Video Trimmer – Cut Videos in Your Browser"), text("description", "Meta description", "Trim the start and end of a video without uploading it."),
      text("author", "Author (optional)", ""), text("canonical", "Canonical URL (optional)", "https://example.com/tools/video-trimmer"), text("theme", "Theme color (optional)", "#0f172a"),
      { id: "robots", label: "Robots", type: "select", choices: [["", "Default (index, follow)"], ["noindex, follow", "noindex, follow"], ["noindex, nofollow", "noindex, nofollow"], ["index, nofollow", "index, nofollow"]], default: "" },
      text("lang", "Page language (for <html lang>)", "en"),
    ],
    outputLabel: "HTML head tags", outputExt: "html",
    note: "The meta keywords tag is not included because Google says it does not use it.",
    run(_, o) {
      if (!str(o, "title")) throw new Error("Enter a page title.");
      if (str(o, "canonical")) absoluteUrl(str(o, "canonical"), "Canonical URL");
      return [`<!-- put lang on the html element: <html lang="${escapeHtml(str(o, "lang") || "en")}"> -->`, `<meta charset="utf-8">`, `<meta name="viewport" content="width=device-width, initial-scale=1">`, `<title>${escapeHtml(str(o, "title"))}</title>`,
        meta("name", "description", str(o, "description")), meta("name", "author", str(o, "author")), meta("name", "robots", str(o, "robots")), meta("name", "theme-color", str(o, "theme")),
        str(o, "canonical") ? `<link rel="canonical" href="${escapeHtml(str(o, "canonical"))}">` : ""].filter(Boolean).join("\n");
    },
  },
  "canonical-tag-generator": {
    input: { label: "Page URLs (one per line)", example: "http://Example.com/Tools/Video-Trimmer/?utm_source=x&ref=home#top\nhttps://example.com/blog/post?id=7", rows: 5 },
    options: [
      { id: "https", label: "Force https", type: "checkbox", default: true },
      { id: "query", label: "Remove query strings", type: "checkbox", default: false },
      { id: "tracking", label: "Remove tracking parameters (utm_*, gclid, fbclid…)", type: "checkbox", default: true },
      { id: "slash", label: "Trailing slash", type: "select", choices: [["keep", "Keep as is"], ["add", "Add"], ["remove", "Remove"]], default: "keep" },
    ],
    outputLabel: "Canonical link tags", outputExt: "html",
    note: "Host names are lowercased and #fragments removed. Paths keep their case because servers can treat them as different pages.",
    run(input, o) {
      const all = lines(input);
      if (all.length === 0) throw new Error("Enter at least one URL.");
      return all.map(line => {
        const u = absoluteUrl(line);
        if (o.https) u.protocol = "https:";
        u.hash = "";
        if (o.query) u.search = "";
        else if (o.tracking) [...u.searchParams.keys()].filter(k => /^(utm_|gclid$|fbclid$|msclkid$|mc_eid$|igshid$)/i.test(k)).forEach(k => u.searchParams.delete(k));
        if (o.slash === "add" && !u.pathname.endsWith("/") && !/\.[a-z0-9]{2,5}$/i.test(u.pathname)) u.pathname += "/";
        if (o.slash === "remove" && u.pathname.length > 1) u.pathname = u.pathname.replace(/\/+$/, "");
        return `<link rel="canonical" href="${escapeHtml(u.href)}">`;
      }).join("\n");
    },
  },
  "meta-robots-generator": {
    input: false,
    options: [
      { id: "index", label: "Indexing", type: "select", choices: [["index", "index"], ["noindex", "noindex"]], default: "index" },
      { id: "follow", label: "Links", type: "select", choices: [["follow", "follow"], ["nofollow", "nofollow"]], default: "follow" },
      { id: "noarchive", label: "noarchive", type: "checkbox", default: false }, { id: "nosnippet", label: "nosnippet", type: "checkbox", default: false },
      { id: "noimageindex", label: "noimageindex", type: "checkbox", default: false }, { id: "notranslate", label: "notranslate", type: "checkbox", default: false },
      { id: "snippet", label: "max-snippet (-1 = no limit, blank = omit)", type: "text", default: "-1" },
      { id: "image", label: "max-image-preview", type: "select", choices: [["", "Omit"], ["none", "none"], ["standard", "standard"], ["large", "large"]], default: "large" },
      { id: "video", label: "max-video-preview (-1 = no limit, blank = omit)", type: "text", default: "-1" },
    ],
    outputLabel: "Meta robots tag and header", outputExt: "html",
    run(_, o) {
      const numberRule = (id: string, key: string) => { const v = str(o, id); if (!v) return ""; if (!/^-?\d+$/.test(v) || Number(v) < -1) throw new Error(`${key} must be -1 or a whole number of 0 or more.`); return `${key}:${v}`; };
      const parts = [str(o, "index"), str(o, "follow"), ...["noarchive", "nosnippet", "noimageindex", "notranslate"].filter(k => o[k]), numberRule("snippet", "max-snippet"), str(o, "image") ? `max-image-preview:${str(o, "image")}` : "", numberRule("video", "max-video-preview")].filter(Boolean);
      const value = parts.join(", ");
      return `<meta name="robots" content="${value}">\n\nHTTP header alternative:\nX-Robots-Tag: ${value}`;
    },
  },
  "robots-txt-generator": {
    input: { label: "Paths to block (one per line)", example: "/admin/\n/cart/\n/search?\n/*.pdf$", rows: 6 },
    options: [
      text("agent", "User-agent", "*"), text("allow", "Paths to allow inside blocked ones (comma separated, optional)", "/admin/help/"),
      text("sitemap", "Sitemap URL (optional)", "https://example.com/sitemap.xml"),
      { id: "blockAll", label: "Block the whole site for this user-agent", type: "checkbox", default: false },
    ],
    outputLabel: "robots.txt", outputExt: "txt",
    note: "robots.txt asks crawlers not to fetch pages; it does not hide them or stop a page being indexed from links. Use noindex for that.",
    run(input, o) {
      const clean = (p: string) => { const v = p.trim(); if (v && !v.startsWith("/") && !v.startsWith("*")) throw new Error(`Paths must start with / (got "${v}").`); return v; };
      const disallow = o.blockAll ? ["/"] : lines(input).map(clean);
      const allow = str(o, "allow").split(",").map(clean).filter(Boolean);
      const sitemap = str(o, "sitemap");
      if (sitemap) absoluteUrl(sitemap, "Sitemap URL");
      const body = [`User-agent: ${str(o, "agent") || "*"}`, ...allow.map(p => `Allow: ${p}`), ...(disallow.length ? disallow.map(p => `Disallow: ${p}`) : ["Disallow:"])];
      return [...body, ...(sitemap ? ["", `Sitemap: ${sitemap}`] : [])].join("\n") + "\n";
    },
  },
  "robots-txt-tester": {
    input: { label: "robots.txt", example: "User-agent: *\nDisallow: /admin/\nAllow: /admin/help/\nDisallow: /*.pdf$\n\nUser-agent: Googlebot-Image\nDisallow: /photos/", rows: 10 },
    options: [text("agent", "User-agent", "Googlebot"), text("paths", "Paths to test (comma separated)", "/admin/settings, /admin/help/faq, /files/guide.pdf, /blog/")],
    outputLabel: "Results",
    note: "Follows Google's documented matching: the most specific user-agent group applies, the longest matching rule wins, Allow wins a tie, and * and $ work as wildcards.",
    run(input, o) {
      const paths = str(o, "paths").split(",").map(p => p.trim()).filter(Boolean);
      if (paths.length === 0) throw new Error("Enter at least one path, such as /blog/.");
      return paths.map(p => {
        const path = p.startsWith("http") ? (() => { const u = absoluteUrl(p); return u.pathname + u.search; })() : p;
        const v = robotsVerdict(input, str(o, "agent") || "*", path);
        return `${v.allowed ? "ALLOWED " : "BLOCKED "} ${path}\n          rule: ${v.rule} · group: ${v.group}`;
      }).join("\n");
    },
  },
  "xml-sitemap-generator": {
    input: { label: "Page URLs (one per line)", example: "https://example.com/\nhttps://example.com/tools/\nhttps://example.com/tools/video-trimmer?lang=en&ref=1", rows: 8 },
    options: [
      text("lastmod", "Last modified date (YYYY-MM-DD, optional)", ""),
      { id: "changefreq", label: "Change frequency (optional)", type: "select", choices: [["", "Omit"], ["daily", "daily"], ["weekly", "weekly"], ["monthly", "monthly"], ["yearly", "yearly"]], default: "" },
      { id: "dedupe", label: "Remove duplicate URLs", type: "checkbox", default: true },
    ],
    outputLabel: "sitemap.xml", outputExt: "xml",
    note: "Follows the sitemaps.org protocol (up to 50,000 URLs per file). Google ignores priority and changefreq, so priority is not added.",
    run(input, o) {
      const urls = lines(input).map(l => absoluteUrl(l).href);
      const list = o.dedupe ? [...new Set(urls)] : urls;
      if (list.length === 0) throw new Error("Enter at least one URL.");
      if (list.length > 50000) throw new Error("A sitemap file can hold at most 50,000 URLs. Split the list.");
      const lastmod = str(o, "lastmod");
      if (lastmod && !/^\d{4}-\d{2}-\d{2}$/.test(lastmod)) throw new Error("Write the date as YYYY-MM-DD.");
      const entries = list.map(u => [`  <url>`, `    <loc>${escapeXml(u)}</loc>`, lastmod ? `    <lastmod>${lastmod}</lastmod>` : "", str(o, "changefreq") ? `    <changefreq>${str(o, "changefreq")}</changefreq>` : "", `  </url>`].filter(Boolean).join("\n"));
      return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
    },
  },
  "sitemap-url-extractor": {
    input: { label: "Sitemap XML", example: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://example.com/</loc></url>\n  <url><loc>https://example.com/tools/?a=1&amp;b=2</loc><lastmod>2026-03-01</lastmod></url>\n</urlset>`, rows: 10, accept: ".xml" },
    outputLabel: "URLs",
    run(input) {
      const locs = [...input.matchAll(/<loc>\s*(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?\s*<\/loc>/gi)].map(m => decode(m[1].trim()));
      if (locs.length === 0) throw new Error("No <loc> entries found. Paste the XML of a sitemap or sitemap index.");
      const kind = /<sitemapindex/i.test(input) ? "sitemap index (these are child sitemaps)" : "URL set";
      return `${locs.join("\n")}\n\n(${locs.length} URLs from a ${kind})`;
    },
  },
  "hreflang-tag-generator": {
    input: { label: "Language code and URL (one pair per line)", example: "en https://example.com/\nen-GB https://example.com/uk/\nes https://example.com/es/\nde-DE https://example.com/de/", rows: 6 },
    options: [text("xdefault", "x-default URL (optional)", "https://example.com/")],
    outputLabel: "hreflang link tags", outputExt: "html",
    note: "Put the same full set of tags on every language version, including a link to itself.",
    run(input, o) {
      const pairs = hreflangPairs(input);
      const xd = str(o, "xdefault");
      if (xd) absoluteUrl(xd, "x-default URL");
      return [...pairs.map(([lang, u]) => `<link rel="alternate" hreflang="${lang}" href="${escapeHtml(u)}">`), ...(xd ? [`<link rel="alternate" hreflang="x-default" href="${escapeHtml(xd)}">`] : [])].join("\n");
    },
  },
  "hreflang-sitemap-generator": {
    input: { label: "Language code and URL (one pair per line)", example: "en https://example.com/\nes https://example.com/es/\nde https://example.com/de/", rows: 6 },
    options: [text("xdefault", "x-default URL (optional)", "")],
    outputLabel: "Sitemap with hreflang", outputExt: "xml",
    run(input, o) {
      const pairs = hreflangPairs(input);
      const xd = str(o, "xdefault");
      const alternates = [...pairs, ...(xd ? [["x-default", absoluteUrl(xd, "x-default URL").href] as [string, string]] : [])];
      const links = alternates.map(([lang, u]) => `    <xhtml:link rel="alternate" hreflang="${lang}" href="${escapeXml(u)}"/>`).join("\n");
      const urls = pairs.map(([, u]) => `  <url>\n    <loc>${escapeXml(u)}</loc>\n${links}\n  </url>`).join("\n");
      return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
    },
  },
  "utm-link-builder": {
    input: { label: "Destination URL", example: "https://example.com/tools/video-trimmer" },
    options: [text("source", "utm_source (required)", "newsletter"), text("medium", "utm_medium", "email"), text("campaign", "utm_campaign", "spring_launch"), text("term", "utm_term (optional)", ""), text("content", "utm_content (optional)", ""),
      { id: "lower", label: "Lowercase values", type: "checkbox", default: true }],
    outputLabel: "Tracking link",
    run(input, o) {
      const u = absoluteUrl(input, "Destination URL");
      if (!str(o, "source")) throw new Error("utm_source is required.");
      for (const key of ["source", "medium", "campaign", "term", "content"]) {
        const v = str(o, key).replace(/\s+/g, "_");
        if (v) u.searchParams.set(`utm_${key}`, o.lower ? v.toLowerCase() : v);
      }
      return u.href;
    },
  },
  "utm-link-parser": {
    input: { label: "Links with UTM parameters (one per line)", example: "https://example.com/?utm_source=newsletter&utm_medium=email&utm_campaign=spring_launch\nhttps://example.com/pricing?utm_source=twitter&utm_content=banner", rows: 5 },
    outputLabel: "UTM parameters",
    run(input) {
      const all = lines(input);
      if (all.length === 0) throw new Error("Paste at least one link.");
      return all.map(line => {
        const u = absoluteUrl(line);
        const utm = [...u.searchParams.entries()].filter(([k]) => k.toLowerCase().startsWith("utm_"));
        const clean = new URL(u.href);
        utm.forEach(([k]) => clean.searchParams.delete(k));
        return [`${clean.href}`, ...(utm.length ? utm.map(([k, v]) => `  ${k} = ${v}`) : ["  (no UTM parameters)"])].join("\n");
      }).join("\n\n");
    },
  },
  "htaccess-redirect-generator": {
    input: { label: "Old path and new URL (one pair per line, separated by a space)", example: "/old-page /new-page\n/blog/2019/post https://example.com/blog/post\n/tools/trim /tools/video-trimmer", rows: 6 },
    options: [{ id: "code", label: "Redirect type", type: "select", choices: [["301", "301 Permanent"], ["302", "302 Temporary"]], default: "301" }],
    outputLabel: ".htaccess rules (Apache)", outputExt: "txt",
    note: "Uses Apache mod_alias Redirect lines, which also redirect anything below the old path.",
    run: (input, o) => redirectPairs(input).map(([from, to]) => `Redirect ${o.code} ${quotePath(from)} ${quotePath(to)}`).join("\n"),
  },
  "nginx-redirect-generator": {
    input: { label: "Old path and new URL (one pair per line, separated by a space)", example: "/old-page /new-page\n/blog/2019/post https://example.com/blog/post", rows: 6 },
    options: [{ id: "code", label: "Redirect type", type: "select", choices: [["301", "301 Permanent"], ["302", "302 Temporary"]], default: "301" }],
    outputLabel: "nginx location blocks", outputExt: "conf",
    note: "Exact-match locations: only the old path itself is redirected. Paste inside your server { } block.",
    run: (input, o) => redirectPairs(input).map(([from, to]) => `location = ${quotePath(from)} {\n    return ${o.code} ${quotePath(to)};\n}`).join("\n"),
  },
  "ads-txt-generator": {
    input: { label: "Seller records: domain, publisher ID, DIRECT or RESELLER, certification ID (optional)", example: "google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0\nexample-exchange.com, 12345, reseller", rows: 6 },
    options: [text("contact", "Contact email (optional)", ""), text("owner", "OWNERDOMAIN (optional)", "")],
    outputLabel: "ads.txt", outputExt: "txt",
    note: "Copy each record exactly as your ad network gives it; this tool checks the format, not that the IDs are yours.",
    run(input, o) {
      const records = lines(input).filter(l => !l.startsWith("#")).map(line => {
        const f = line.split(",").map(x => x.trim());
        if (f.length < 3 || f.length > 4) throw new Error(`Each record needs 3 or 4 comma-separated fields (problem: "${line}").`);
        if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(f[0])) throw new Error(`"${f[0]}" is not a domain name.`);
        const rel = f[2].toUpperCase();
        if (rel !== "DIRECT" && rel !== "RESELLER") throw new Error(`The third field must be DIRECT or RESELLER (problem: "${line}").`);
        return [f[0].toLowerCase(), f[1], rel, ...(f[3] ? [f[3]] : [])].join(", ");
      });
      if (records.length === 0) throw new Error("Add at least one seller record.");
      return [...records, ...(str(o, "contact") ? [`contact=${str(o, "contact")}`] : []), ...(str(o, "owner") ? [`ownerdomain=${str(o, "owner")}`] : [])].join("\n") + "\n";
    },
  },
  "heading-structure-checker": {
    input: { label: "Page HTML", example: SAMPLE_HTML, rows: 12 },
    outputLabel: "Heading outline",
    run(input) {
      const heads = [...stripScripts(input).matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map(m => ({ level: Number(m[1]), text: innerText(m[2]) }));
      if (heads.length === 0) throw new Error("No <h1>–<h6> headings found in the HTML.");
      const issues: string[] = [];
      const h1 = heads.filter(h => h.level === 1).length;
      if (h1 === 0) issues.push("No h1 heading.");
      if (h1 > 1) issues.push(`${h1} h1 headings; one is usual.`);
      heads.forEach((h, i) => {
        if (i > 0 && h.level > heads[i - 1].level + 1) issues.push(`"${h.text}" jumps from h${heads[i - 1].level} to h${h.level}.`);
        if (!h.text) issues.push(`An empty h${h.level}.`);
      });
      return [...heads.map(h => `${"  ".repeat(h.level - 1)}h${h.level}: ${h.text || "(empty)"}`), "", issues.length ? `${issues.length} issue(s):` : "Heading order looks fine.", ...issues.map(i => `- ${i}`)].join("\n");
    },
  },
  "image-alt-checker": {
    input: { label: "Page HTML", example: SAMPLE_HTML, rows: 12 },
    outputLabel: "Image alt text report",
    run(input) {
      const imgs = [...stripScripts(input).matchAll(/<img\b[^>]*>/gi)].map(m => ({ src: attr(m[0], "src") ?? "(no src)", alt: attr(m[0], "alt") }));
      if (imgs.length === 0) throw new Error("No <img> tags found.");
      const missing = imgs.filter(i => i.alt === null);
      const empty = imgs.filter(i => i.alt !== null && i.alt.trim() === "");
      return [`Images: ${imgs.length} · Missing alt: ${missing.length} · Empty alt (decorative): ${empty.length}`, "", ...imgs.map(i => `${i.alt === null ? "MISSING" : i.alt.trim() === "" ? "EMPTY  " : "OK     "} ${i.src}${i.alt ? ` — "${decode(i.alt)}"` : ""}`)].join("\n");
    },
  },
  "link-extractor": {
    input: { label: "Page HTML", example: SAMPLE_HTML, rows: 12 },
    options: [text("domain", "Your domain (to mark internal links)", "example.com")],
    outputLabel: "Links",
    run(input, o) {
      const domain = str(o, "domain").toLowerCase().replace(/^www\./, "");
      const links = [...stripScripts(input).matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)].map(m => ({ href: attr(m[0], "href"), rel: attr(m[0], "rel") ?? "", text: innerText(m[1]) })).filter(l => l.href !== null);
      if (links.length === 0) throw new Error("No <a href> links found.");
      const kind = (href: string) => {
        if (/^(mailto|tel|javascript):/i.test(href)) return "other   ";
        if (!/^(https?:)?\/\//i.test(href)) return "internal";
        try { const host = new URL(href, "https://x.invalid").hostname.toLowerCase().replace(/^www\./, ""); return domain && (host === domain || host.endsWith(`.${domain}`)) ? "internal" : "external"; } catch { return "invalid "; }
      };
      return links.map(l => `${kind(l.href ?? "")}  ${decode(l.href ?? "")}${l.rel ? `  [rel=${l.rel}]` : ""}${l.text ? `  "${l.text}"` : ""}`).join("\n");
    },
  },
  "meta-tag-analyzer": {
    input: { label: "Page HTML (the <head> is enough)", example: SAMPLE_HTML, rows: 12 },
    outputLabel: "Meta tag report",
    run(input) {
      const html = stripScripts(input);
      const title = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html);
      const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map(m => ({ key: attr(m[0], "name") ?? attr(m[0], "property"), content: attr(m[0], "content") })).filter(m => m.key && m.content !== null);
      const canonical = [...html.matchAll(/<link\b[^>]*>/gi)].map(m => m[0]).find(tag => /rel\s*=\s*["']?canonical/i.test(tag));
      const get = (k: string) => metas.find(m => m.key?.toLowerCase() === k)?.content ?? null;
      const t = title ? innerText(title[1]) : null;
      const d = get("description");
      const rows = [
        `Title: ${t ?? "MISSING"}${t ? ` (${chars(t)} characters)` : ""}`,
        `Description: ${d ? `${decode(d)} (${chars(decode(d))} characters)` : "MISSING"}`,
        `Canonical: ${canonical ? attr(canonical, "href") : "MISSING"}`,
        `Robots: ${get("robots") ?? "(not set — defaults to index, follow)"}`,
        `Viewport: ${get("viewport") ?? "MISSING"}`,
        "", "Other meta tags:",
        ...metas.filter(m => !["description", "robots", "viewport"].includes(m.key?.toLowerCase() ?? "")).map(m => `  ${m.key} = ${decode(m.content ?? "")}`),
      ];
      return rows.join("\n");
    },
  },
  "jsonld-syntax-checker": {
    input: { label: "HTML with JSON-LD scripts, or raw JSON-LD", example: `<script type="application/ld+json">\n{"@context": "https://schema.org", "@type": "Organization", "name": "Example Inc.", "url": "https://example.com"}\n</script>`, rows: 10 },
    outputLabel: "JSON-LD check",
    note: "Checks that each block is valid JSON with @context and @type. It is not a replacement for Google's Rich Results Test.",
    run(input) {
      const blocks = [...input.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
      const sources = blocks.length ? blocks : [input];
      return sources.map((src, i) => {
        let data: unknown;
        try { data = JSON.parse(src); } catch (e) { return `Block ${i + 1}: INVALID JSON — ${e instanceof Error ? e.message : "syntax error"}`; }
        const items = (Array.isArray(data) ? data : [data]).flatMap(item => (item && typeof item === "object" && "@graph" in item && Array.isArray((item as Record<string, unknown>)["@graph"]) ? ((item as Record<string, unknown>)["@graph"] as unknown[]) : [item]));
        const root = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | null;
        const problems = [
          !root || typeof root !== "object" ? "top level is not an object" : "",
          root && typeof root === "object" && !String(root["@context"] ?? "").includes("schema.org") ? "@context is missing or not schema.org" : "",
          ...items.map((it, j) => (it && typeof it === "object" && "@type" in it ? "" : `item ${j + 1} has no @type`)),
        ].filter(Boolean);
        const types = items.map(it => (it && typeof it === "object" ? String((it as Record<string, unknown>)["@type"] ?? "?") : "?"));
        return `Block ${i + 1}: ${problems.length ? `PROBLEMS — ${problems.join("; ")}` : "valid JSON-LD syntax"} · types: ${types.join(", ")}`;
      }).join("\n");
    },
  },
};

function hreflangPairs(input: string): Array<[string, string]> {
  const pairs = lines(input).map(line => {
    const [lang, link] = line.split(/[\s,|]+/);
    if (!lang || !link) throw new Error(`Write each line as "language URL", e.g. "en-GB https://example.com/uk/" (problem: "${line}").`);
    if (!/^(?:[a-z]{2,3}(?:-(?:[A-Za-z]{4}))?(?:-(?:[A-Za-z]{2}|\d{3}))?|x-default)$/i.test(lang)) throw new Error(`"${lang}" is not a valid hreflang code. Use ISO 639-1 language with optional ISO 3166-1 region, e.g. en, en-GB, es-419.`);
    const [l, ...rest] = lang.split("-");
    const code = [l.toLowerCase(), ...rest.map(r => (r.length === 2 ? r.toUpperCase() : r.length === 4 ? r[0].toUpperCase() + r.slice(1).toLowerCase() : r))].join("-");
    return [code, absoluteUrl(link).href] as [string, string];
  });
  if (pairs.length === 0) throw new Error("Add at least one language and URL.");
  return pairs;
}

function redirectPairs(input: string): Array<[string, string]> {
  const pairs = lines(input).map(line => {
    const parts = line.split(/\s+|\s*(?:->|=>|,)\s*/).filter(Boolean);
    if (parts.length !== 2) throw new Error(`Each line needs an old path and a new URL (problem: "${line}").`);
    if (!parts[0].startsWith("/")) throw new Error(`The old path must start with / (problem: "${parts[0]}").`);
    if (!parts[1].startsWith("/")) absoluteUrl(parts[1], "The new URL");
    return [parts[0], parts[1]] as [string, string];
  });
  if (pairs.length === 0) throw new Error("Add at least one redirect.");
  return pairs;
}

function quotePath(value: string): string {
  return /[\s"]/.test(value) ? `"${value.replace(/"/g, "%22")}"` : value;
}
