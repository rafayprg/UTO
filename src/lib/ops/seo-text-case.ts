// Case converters and line/list utilities. Self-contained.
import type { OptionValues, TextOp } from "./types";

const SAMPLE_CASE = "user profile settings\nHTMLParser version2Update\nget-api_response Data";
const SAMPLE_LINES = "banana\nApple\ncherry\napple\n\nitem 10\nitem 2\nitem 1\nbanana";
const SAMPLE_PROSE = "the quick brown fox jumps over the lazy dog. it was the best of times, it was the worst of times.\nhow to build a website in 10 easy steps";

/** Splits identifiers and phrases into words: spaces, punctuation and camelCase boundaries. */
export function splitWords(text: string): string[] {
  return text.match(/\p{Lu}+(?=\p{Lu}\p{Ll})|\p{Lu}?\p{Ll}+\p{N}*|\p{Lu}+\p{N}*|\p{N}+\p{Ll}*/gu) ?? [];
}

const cap = (word: string) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word);

function perLine(input: string, convert: (line: string) => string): string {
  return input.split(/\r?\n/).map(line => (line.trim() ? convert(line) : line)).join("\n");
}

function joined(sep: string, transform: (w: string, i: number) => string) {
  return (line: string) => splitWords(line).map(transform).join(sep);
}

// Title case: simplified US (Chicago-like) rules, documented in the tool note.
const MINOR = new Set(["a", "an", "the", "and", "but", "or", "nor", "for", "so", "yet", "as", "at", "by", "in", "of", "off", "on", "out", "per", "to", "up", "via", "vs", "vs."]);

function titleWord(word: string, force: boolean): string {
  if (/\p{Ll}\p{Lu}/u.test(word)) return word; // iPhone, eBay
  if (/^\P{L}*\p{Lu}{2,}\p{N}*\P{L}*$/u.test(word)) return word; // NASA, USB, (FAQ)
  const lower = word.toLowerCase();
  if (!force && MINOR.has(lower)) return lower;
  return lower.split("-").map(part => part.replace(/^(\P{L}*)(\p{L})/u, (_, pre: string, ch: string) => pre + ch.toUpperCase())).join("-");
}

export function titleCase(line: string): string {
  // A line typed in all caps carries no acronym information, so start from lowercase.
  const source = line === line.toUpperCase() ? line.toLowerCase() : line;
  const tokens = source.split(/(\s+)/);
  const wordIdx = tokens.map((t, i) => (t.trim() ? i : -1)).filter(i => i >= 0);
  const first = wordIdx[0];
  const last = wordIdx[wordIdx.length - 1];
  return tokens.map((token, i) => {
    if (!token.trim()) return token;
    const prev = tokens.slice(0, i).reverse().find(t => t.trim());
    const afterColon = prev ? /[:—?!]$/.test(prev) : false;
    return titleWord(token, i === first || i === last || afterColon);
  }).join("");
}

export function sentenceCase(text: string): string {
  return text.toLowerCase()
    .replace(/(^\s*|[.!?]\s+)(\p{L})/gu, (_, pre: string, ch: string) => pre + ch.toUpperCase())
    .replace(/\bi\b(?=[\s'’,.!?]|$)/g, "I");
}

function alternating(text: string, startUpper: boolean): string {
  let i = startUpper ? 0 : 1;
  return [...text].map(ch => {
    if (!/\p{L}/u.test(ch)) return ch;
    i += 1;
    return i % 2 === 0 ? ch.toUpperCase() : ch.toLowerCase();
  }).join("");
}

const caseOp = (convert: (line: string) => string, label: string, example = SAMPLE_CASE): TextOp => ({
  input: { label: "Text (each line is converted separately)", example, rows: 6 },
  outputLabel: label,
  run: input => perLine(input, convert),
});

const collator = (o: OptionValues) => new Intl.Collator("en", { sensitivity: o.caseSensitive ? "variant" : "base", numeric: false });
const naturalCollator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

function linesOf(input: string, o: OptionValues): string[] {
  const all = input.split(/\r?\n/).map(line => (o.trim ? line.trim() : line));
  return o.keepEmpty ? all : all.filter(line => line.trim() !== "");
}

const sortOptions: TextOp["options"] = [
  { id: "caseSensitive", label: "Case-sensitive (A before a)", type: "checkbox", default: false },
  { id: "trim", label: "Trim spaces at line ends", type: "checkbox", default: true },
  { id: "keepEmpty", label: "Keep empty lines", type: "checkbox", default: false },
];

const lineOp = (label: string, transform: (lines: string[], o: OptionValues) => string[], options: TextOp["options"] = sortOptions, extra: Partial<TextOp> = {}): TextOp => ({
  input: { label: "Lines of text", example: SAMPLE_LINES, rows: 10 },
  options,
  outputLabel: label,
  run(input, o) {
    const lines = linesOf(input, o);
    if (lines.length === 0) throw new Error("Enter at least one line of text.");
    return transform(lines, o).join("\n");
  },
  ...extra,
});

function firstNumber(line: string): number | null {
  const match = /[-+]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?(?:e[-+]?\d+)?/i.exec(line);
  return match ? Number(match[0].replace(/,/g, "")) : null;
}

function secureShuffle<T>(items: T[]): T[] {
  const out = [...items];
  const random = new Uint32Array(out.length);
  crypto.getRandomValues(random);
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = random[i] % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function unescapeControls(value: string): string {
  return value.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildRegex(source: string, flags: string): RegExp {
  if (!source) throw new Error("Enter a pattern to search for.");
  try { return new RegExp(source, flags); }
  catch (error) { throw new Error(`That regular expression is not valid: ${error instanceof Error ? error.message : "syntax error"}.`); }
}

export const caseOps: Record<string, TextOp> = {
  "camel-case": caseOp(joined("", (w, i) => (i === 0 ? w.toLowerCase() : cap(w))), "camelCase"),
  "pascal-case": caseOp(joined("", cap), "PascalCase"),
  "snake-case": caseOp(joined("_", w => w.toLowerCase()), "snake_case"),
  "kebab-case": caseOp(joined("-", w => w.toLowerCase()), "kebab-case"),
  "constant-case": caseOp(joined("_", w => w.toUpperCase()), "CONSTANT_CASE"),
  "dot-case": caseOp(joined(".", w => w.toLowerCase()), "dot.case"),
  "path-case": caseOp(joined("/", w => w.toLowerCase()), "path/case"),
  "title-case": {
    ...caseOp(titleCase, "Title Case", SAMPLE_PROSE),
    note: "US title case (simplified Chicago style): capitalizes the first and last word, words after a colon, and every word except articles (a, an, the), coordinating conjunctions (and, but, or, nor, for, so, yet) and short prepositions (as, at, by, in, of, off, on, out, per, to, up, via). Words like iPhone or NASA are kept.",
  },
  "capitalize-words": caseOp(line => line.toLowerCase().replace(/(^|[\s\-/("'])(\p{L})/gu, (_, pre: string, ch: string) => pre + ch.toUpperCase()), "Every Word Capitalized", SAMPLE_PROSE),
  "sentence-case": {
    input: { label: "Text", example: "THIS IS A HEADLINE WRITTEN IN CAPS. please fix it! i think it looks better now.", rows: 6 },
    outputLabel: "Sentence case",
    note: "Lowercases everything, then capitalizes the first letter of each sentence and the word \"I\". Names and acronyms need fixing by hand.",
    run: input => sentenceCase(input),
  },
  "uppercase": { input: { label: "Text", example: SAMPLE_PROSE, rows: 6 }, outputLabel: "UPPERCASE", run: input => input.toUpperCase() },
  "lowercase": { input: { label: "Text", example: "Make THIS Text All LOWERCASE, Please.", rows: 6 }, outputLabel: "lowercase", run: input => input.toLowerCase() },
  "alternating-case": {
    input: { label: "Text", example: "alternating case looks like this", rows: 6 },
    options: [{ id: "upperFirst", label: "Start with a capital letter", type: "checkbox", default: false }],
    outputLabel: "aLtErNaTiNg CaSe",
    note: "Only letters count toward the alternation; spaces and punctuation are skipped.",
    run: (input, o) => alternating(input, Boolean(o.upperFirst)),
  },
  "inverse-case": {
    input: { label: "Text", example: "Hello World, This Is Inverse Case", rows: 6 },
    outputLabel: "iNVERSE cASE",
    run: input => [...input].map(ch => (ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase())).join(""),
  },
};

export const lineOps: Record<string, TextOp> = {
  "remove-duplicate-lines": lineOp("Unique lines", (lines, o) => {
    const seen = new Set<string>();
    return lines.filter(line => {
      const key = o.caseSensitive ? line : line.toLowerCase();
      if (seen.has(key) && line.trim() !== "") return false;
      seen.add(key);
      return true;
    });
  }, sortOptions, { note: "Keeps the first copy of each line in its original position." }),
  "sort-lines-az": lineOp("Sorted A–Z", (lines, o) => [...lines].sort(collator(o).compare)),
  "sort-lines-za": lineOp("Sorted Z–A", (lines, o) => [...lines].sort(collator(o).compare).reverse()),
  "sort-lines-numeric": lineOp("Sorted by number", (lines, o) => {
    const withNum = lines.map(line => ({ line, n: firstNumber(line) }));
    const numbered = withNum.filter(x => x.n !== null).sort((a, b) => (o.desc ? (b.n ?? 0) - (a.n ?? 0) : (a.n ?? 0) - (b.n ?? 0)));
    return [...numbered, ...withNum.filter(x => x.n === null)].map(x => x.line);
  }, [{ id: "desc", label: "Largest first", type: "checkbox", default: false }, ...(sortOptions ?? []).slice(1)], { note: "Sorts by the first number in each line (1,000 and decimals are understood). Lines without a number go last." }),
  "natural-sort-lines": lineOp("Natural order", lines => [...lines].sort(naturalCollator.compare), (sortOptions ?? []).slice(1), { note: "Numbers inside text sort by value: item 2 comes before item 10." }),
  "sort-lines-by-length": lineOp("Sorted by length", (lines, o) => [...lines].sort((a, b) => (o.desc ? [...b].length - [...a].length : [...a].length - [...b].length)), [{ id: "desc", label: "Longest first", type: "checkbox", default: false }, ...(sortOptions ?? []).slice(1)]),
  "shuffle-lines": lineOp("Shuffled lines", lines => secureShuffle(lines), (sortOptions ?? []).slice(1), { manual: true, note: "Uses the browser's cryptographic random generator for an unbiased shuffle." }),
  "reverse-lines": lineOp("Reversed order", lines => [...lines].reverse(), [{ id: "keepEmpty", label: "Keep empty lines", type: "checkbox", default: true }]),
  "add-prefix-suffix": {
    input: { label: "Lines of text", example: "apple\nbanana\ncherry", rows: 8 },
    options: [
      { id: "prefix", label: "Prefix", type: "text", default: "- " },
      { id: "suffix", label: "Suffix", type: "text", default: "," },
      { id: "skipEmpty", label: "Skip empty lines", type: "checkbox", default: true },
    ],
    outputLabel: "Lines with prefix and suffix",
    run(input, o) {
      return input.split(/\r?\n/).map(line => (o.skipEmpty && !line.trim() ? line : `${o.prefix}${line}${o.suffix}`)).join("\n");
    },
  },
  "find-and-replace": {
    input: { label: "Text", example: "The color of the sky. Color matters. Colorful!", rows: 8 },
    options: [
      { id: "find", label: "Find", type: "text", default: "color" },
      { id: "replace", label: "Replace with", type: "text", default: "colour" },
      { id: "caseSensitive", label: "Match case", type: "checkbox", default: false },
      { id: "wholeWord", label: "Whole words only", type: "checkbox", default: true },
      { id: "escapes", label: "Treat \\n and \\t as line break and tab", type: "checkbox", default: false },
    ],
    outputLabel: "Result",
    run(input, o) {
      const find = o.escapes ? unescapeControls(String(o.find)) : String(o.find);
      if (!find) throw new Error("Enter the text to find.");
      const source = o.wholeWord ? `(?<![\\p{L}\\p{N}_])${escapeRegExp(find)}(?![\\p{L}\\p{N}_])` : escapeRegExp(find);
      const replacement = o.escapes ? unescapeControls(String(o.replace)) : String(o.replace);
      return input.replace(new RegExp(source, o.caseSensitive ? "gu" : "giu"), () => replacement);
    },
  },
  "regex-replace": {
    input: { label: "Text", example: "Order 1234 shipped on 2026-03-15. Order 5678 shipped on 2026-04-02.", rows: 8 },
    options: [
      { id: "pattern", label: "Regular expression", type: "text", default: "(\\d{4})-(\\d{2})-(\\d{2})" },
      { id: "replace", label: "Replacement ($1, $2… for groups)", type: "text", default: "$2/$3/$1" },
      { id: "global", label: "Replace all (g)", type: "checkbox", default: true },
      { id: "ignoreCase", label: "Ignore case (i)", type: "checkbox", default: false },
      { id: "multiline", label: "^ and $ match each line (m)", type: "checkbox", default: false },
      { id: "dotAll", label: ". matches line breaks (s)", type: "checkbox", default: false },
    ],
    outputLabel: "Result",
    note: "Uses JavaScript regular expression syntax with Unicode mode (u).",
    run(input, o) {
      const flags = `${o.global ? "g" : ""}${o.ignoreCase ? "i" : ""}${o.multiline ? "m" : ""}${o.dotAll ? "s" : ""}u`;
      return input.replace(buildRegex(String(o.pattern), flags), String(o.replace));
    },
  },
  "remove-empty-lines": {
    input: { label: "Text", example: "First line\n\n\nSecond line\n   \nThird line", rows: 8 },
    options: [{ id: "whitespace", label: "Also remove lines with only spaces or tabs", type: "checkbox", default: true }],
    outputLabel: "Without empty lines",
    run: (input, o) => input.split(/\r?\n/).filter(line => (o.whitespace ? line.trim() !== "" : line !== "")).join("\n"),
  },
  "trim-whitespace": {
    input: { label: "Text", example: "   too   many    spaces   \n\t tabs\tand   spaces \t", rows: 8 },
    options: [
      { id: "mode", label: "Trim each line", type: "select", choices: [["both", "Both ends"], ["start", "Start only"], ["end", "End only"], ["none", "Do not trim"]], default: "both" },
      { id: "collapse", label: "Collapse repeated spaces", type: "checkbox", default: true },
      { id: "tabs", label: "Turn tabs into spaces", type: "checkbox", default: true },
    ],
    outputLabel: "Trimmed text",
    run(input, o) {
      return input.split(/\r?\n/).map(raw => {
        let line = o.tabs ? raw.replace(/\t/g, " ") : raw;
        if (o.collapse) line = line.replace(/(\S)[  ]{2,}(?=\S)/g, "$1 ");
        if (o.mode === "both") return line.trim();
        if (o.mode === "start") return line.trimStart();
        return o.mode === "end" ? line.trimEnd() : line;
      }).join("\n");
    },
  },
  "remove-line-breaks": {
    input: { label: "Text", example: "This text was copied\nfrom a PDF and has\nline breaks everywhere.\n\nThis is a new paragraph\nthat should stay separate.", rows: 8 },
    options: [
      { id: "join", label: "Replace line breaks with", type: "select", choices: [["space", "A space"], ["none", "Nothing"]], default: "space" },
      { id: "paragraphs", label: "Keep paragraph breaks (blank lines)", type: "checkbox", default: true },
    ],
    outputLabel: "Joined text",
    run(input, o) {
      const sep = o.join === "space" ? " " : "";
      const joinBlock = (block: string) => block.split(/\r?\n/).map(l => l.trim()).filter(Boolean).join(sep);
      return o.paragraphs ? input.split(/\r?\n\s*\r?\n/).map(joinBlock).filter(Boolean).join("\n\n") : joinBlock(input);
    },
  },
  "add-line-numbers": {
    input: { label: "Text", example: "First line\nSecond line\n\nFourth line", rows: 8 },
    options: [
      { id: "start", label: "Start at", type: "number", default: 1 },
      { id: "sep", label: "Separator", type: "text", default: ". " },
      { id: "pad", label: "Pad numbers to the same width", type: "checkbox", default: false },
      { id: "skipEmpty", label: "Do not number empty lines", type: "checkbox", default: false },
    ],
    outputLabel: "Numbered lines",
    run(input, o) {
      const start = Math.trunc(Number(o.start));
      if (!Number.isFinite(start)) throw new Error("Start must be a number.");
      const lines = input.split(/\r?\n/);
      const width = String(start + lines.length - 1).length;
      let n = start;
      return lines.map(line => {
        if (o.skipEmpty && !line.trim()) return line;
        const label = o.pad ? String(n).padStart(width, "0") : String(n);
        n += 1;
        return `${label}${o.sep}${line}`;
      }).join("\n");
    },
  },
};

export const listOps: Record<string, TextOp> = {
  "url-slug-generator": {
    input: { label: "Title or phrase (one per line)", example: "10 Tips for Café Owners: Brewing Better Coffee!\nWhat's New in 2026?", rows: 4 },
    options: [
      { id: "sep", label: "Separator", type: "select", choices: [["-", "Hyphen (-)"], ["_", "Underscore (_)"]], default: "-" },
      { id: "max", label: "Maximum length (0 = no limit)", type: "number", default: 0, min: 0 },
    ],
    outputLabel: "Slugs",
    note: "Removes accents, lowercases, and keeps only a–z, 0–9 and the separator.",
    run(input, o) {
      const sep = String(o.sep);
      const max = Math.max(0, Math.floor(Number(o.max) || 0));
      return perLine(input, line => {
        const slug = line.normalize("NFKD").replace(/\p{M}/gu, "").replace(/ß/g, "ss").replace(/['’]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, sep).replace(new RegExp(`^\\${sep}+|\\${sep}+$`, "g"), "");
        return max && slug.length > max ? slug.slice(0, max).replace(new RegExp(`\\${sep}[^\\${sep}]*$`), "") || slug.slice(0, max) : slug;
      });
    },
  },
  "text-to-list": {
    input: { label: "Text with items", example: "red, green, blue; yellow, purple", rows: 4 },
    options: [
      { id: "delim", label: "Split on", type: "select", choices: [["comma", "Commas"], ["semicolon", "Semicolons"], ["both", "Commas and semicolons"], ["space", "Spaces"], ["custom", "Custom text"]], default: "both" },
      { id: "custom", label: "Custom separator", type: "text", default: "|" },
      { id: "unique", label: "Remove duplicates", type: "checkbox", default: false },
    ],
    outputLabel: "One item per line",
    run(input, o) {
      const patterns: Record<string, RegExp> = { comma: /,/, semicolon: /;/, both: /[,;]/, space: /\s+/ };
      const custom = String(o.custom);
      if (o.delim === "custom" && !custom) throw new Error("Enter a custom separator.");
      const parts = input.split(o.delim === "custom" ? custom : patterns[String(o.delim)] ?? /,/).flatMap(p => p.split(/\r?\n/)).map(p => p.trim()).filter(Boolean);
      return (o.unique ? [...new Set(parts)] : parts).join("\n");
    },
  },
  "list-to-comma-separated": {
    input: { label: "List (one item per line)", example: "apple\nbanana\ncherry\ndate", rows: 8 },
    options: [
      { id: "sep", label: "Separator", type: "select", choices: [[", ", "Comma and space"], [",", "Comma"], ["; ", "Semicolon"], [" | ", "Pipe"], [" ", "Space"]], default: ", " },
      { id: "quote", label: "Wrap items in", type: "select", choices: [["", "Nothing"], ["'", "Single quotes"], ["\"", "Double quotes"]], default: "" },
      { id: "unique", label: "Remove duplicates", type: "checkbox", default: false },
    ],
    outputLabel: "Joined list",
    run(input, o) {
      const items = input.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const q = String(o.quote);
      const list = o.unique ? [...new Set(items)] : items;
      return list.map(item => (q ? `${q}${item.split(q).join(`\\${q}`)}${q}` : item)).join(String(o.sep));
    },
  },
  "wrap-text": {
    input: { label: "Text", example: "Plain-text emails and code comments are easier to read when long lines are wrapped at a fixed width, such as 72 or 80 characters.", rows: 6 },
    options: [
      { id: "width", label: "Column width", type: "number", default: 40, min: 5, max: 500 },
      { id: "breakLong", label: "Break words longer than the width", type: "checkbox", default: false },
    ],
    outputLabel: "Wrapped text",
    run(input, o) {
      const width = Math.floor(Number(o.width));
      if (!Number.isFinite(width) || width < 5) throw new Error("Column width must be at least 5.");
      return input.split(/\r?\n/).map(line => wrapLine(line, width, Boolean(o.breakLong))).join("\n");
    },
  },
  "text-repeater": {
    input: { label: "Text to repeat", example: "Hello! ", rows: 3 },
    options: [
      { id: "count", label: "Times", type: "number", default: 5, min: 1, max: 10000 },
      { id: "sep", label: "Between copies", type: "select", choices: [["newline", "New line"], ["space", "Space"], ["none", "Nothing"]], default: "newline" },
    ],
    outputLabel: "Repeated text",
    run(input, o) {
      const count = Math.floor(Number(o.count));
      if (!Number.isFinite(count) || count < 1 || count > 10000) throw new Error("Choose between 1 and 10,000 repeats.");
      const sep = o.sep === "newline" ? "\n" : o.sep === "space" ? " " : "";
      if ((input.length + sep.length) * count > 1_000_000) throw new Error("The result would be over 1,000,000 characters. Use fewer repeats.");
      return Array.from({ length: count }, () => input).join(sep);
    },
  },
  "reverse-text": {
    input: { label: "Text", example: "Hello, world! 👋🏽 Ça va?", rows: 4 },
    options: [{ id: "mode", label: "Reverse", type: "select", choices: [["chars", "Characters"], ["words", "Word order"], ["eachWord", "Letters in each word"]], default: "chars" }],
    outputLabel: "Reversed",
    note: "Keeps emoji and accented letters intact by reversing whole characters (grapheme clusters).",
    run(input, o) {
      if (o.mode === "words") return input.split(/\r?\n/).map(line => line.split(/(\s+)/).reverse().join("")).join("\n");
      if (o.mode === "eachWord") return input.replace(/\S+/g, word => graphemes(word).reverse().join(""));
      return graphemes(input).reverse().join("");
    },
  },
  "filter-lines": {
    input: { label: "Lines of text", example: "ERROR disk full\nINFO started\nWARN slow response\nERROR timeout\nINFO done", rows: 8 },
    options: [
      { id: "query", label: "Text to look for", type: "text", default: "ERROR" },
      { id: "mode", label: "Lines to keep", type: "select", choices: [["keep", "Lines that contain it"], ["remove", "Lines that do not contain it"]], default: "keep" },
      { id: "caseSensitive", label: "Match case", type: "checkbox", default: false },
      { id: "regex", label: "Treat as a regular expression", type: "checkbox", default: false },
    ],
    outputLabel: "Filtered lines",
    run(input, o) {
      const query = String(o.query);
      if (!query) throw new Error("Enter the text to look for.");
      const re = buildRegex(o.regex ? query : escapeRegExp(query), o.caseSensitive ? "u" : "iu");
      return input.split(/\r?\n/).filter(line => re.test(line) === (o.mode === "keep")).join("\n");
    },
  },
  "extract-urls": {
    input: { label: "Text", example: "Docs are at https://example.com/docs, and the blog (https://blog.example.com/post?id=7) has more. Old: http://example.org.", rows: 6 },
    options: [{ id: "unique", label: "Remove duplicates", type: "checkbox", default: true }],
    outputLabel: "URLs",
    run(input, o) {
      const found = (input.match(/\bhttps?:\/\/[^\s<>"'`]+/gi) ?? []).map(trimUrl);
      if (found.length === 0) throw new Error("No http:// or https:// links were found.");
      return (o.unique ? [...new Set(found)] : found).join("\n");
    },
  },
  "remove-accents": {
    input: { label: "Text", example: "Crème brûlée, jalapeño, naïve café in São Paulo. Straße, Øresund, Łódź.", rows: 4 },
    options: [{ id: "letters", label: "Also replace ß, æ, ø, ł, đ, þ, œ with plain letters", type: "checkbox", default: true }],
    outputLabel: "Text without accents",
    run(input, o) {
      const stripped = input.normalize("NFD").replace(/\p{M}/gu, "").normalize("NFC");
      if (!o.letters) return stripped;
      const map: Record<string, string> = { ß: "ss", æ: "ae", Æ: "AE", ø: "o", Ø: "O", ł: "l", Ł: "L", đ: "d", Đ: "D", þ: "th", Þ: "Th", œ: "oe", Œ: "OE" };
      return stripped.replace(/[ßæÆøØłŁđĐþÞœŒ]/g, ch => map[ch]);
    },
  },
};

function trimUrl(url: string): string {
  let out = url.replace(/[.,;:!?]+$/, "");
  while (out.endsWith(")") && (out.match(/\(/g) ?? []).length < (out.match(/\)/g) ?? []).length) out = out.slice(0, -1);
  return out;
}

function graphemes(text: string): string[] {
  if (typeof Intl.Segmenter === "function") return [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(text)].map(s => s.segment);
  return [...text];
}

function wrapLine(line: string, width: number, breakLong: boolean): string {
  if ([...line].length <= width) return line;
  const out: string[] = [];
  let current = "";
  for (const raw of line.split(/\s+/).filter(Boolean)) {
    let word = raw;
    while (breakLong && [...word].length > width) {
      if (current) { out.push(current); current = ""; }
      out.push([...word].slice(0, width).join(""));
      word = [...word].slice(width).join("");
    }
    if (current && [...`${current} ${word}`].length > width) { out.push(current); current = word; }
    else current = current ? `${current} ${word}` : word;
  }
  return [...out, ...(current ? [current] : [])].join("\n");
}
